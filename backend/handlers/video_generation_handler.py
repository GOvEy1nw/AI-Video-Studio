"""Video generation orchestration handler."""

from __future__ import annotations

import logging
import math
import os
import tempfile
import time
import uuid
from datetime import datetime
from pathlib import Path
from threading import RLock
from typing import TYPE_CHECKING, cast

from PIL import Image

from api_types import GenerateVideoRequest, GenerateVideoResponse, ImageConditioningInput, VideoCameraMotion
from _routes._errors import HTTPError
from handlers.base import StateHandlerBase
from handlers.generation_handler import GenerationHandler
from handlers.pipelines_handler import PipelinesHandler
from handlers.text_handler import TextHandler
from model_profiles import get_video_profile, is_combination_supported, resolve_resolution
from model_profiles.profiles import AspectRatio, ModelProfile, ResolutionTier
from services.wangp_bridge import WanGPBridge
from services.reframe_wangp_mapping import ReframePadding, map_reframe_to_wangp
from services.video_clip import extract_audio_clip, extract_video_clip, probe_video_metadata
from server_utils.media_validation import (
    normalize_optional_path,
    validate_audio_file,
    validate_image_file,
    validate_video_file,
)
from services.interfaces import LTXAPIClient
from state.app_state_types import AppState

if TYPE_CHECKING:
    from runtime_config.runtime_config import RuntimeConfig

logger = logging.getLogger(__name__)

FORCED_API_MODEL_MAP: dict[str, str] = {
    "fast": "ltx-2-3-fast",
    "pro": "ltx-2-3-pro",
}
FORCED_API_RESOLUTION_MAP: dict[str, dict[str, str]] = {
    "1080p": {"16:9": "1920x1080", "1:1": "1080x1080", "9:16": "1080x1920"},
    "1440p": {"16:9": "2560x1440", "1:1": "1440x1440", "9:16": "1440x2560"},
    "2160p": {"16:9": "3840x2160", "1:1": "2160x2160", "9:16": "2160x3840"},
}
A2V_FORCED_API_RESOLUTION = "1920x1080"
FORCED_API_ALLOWED_ASPECT_RATIOS = {"16:9", "1:1", "9:16"}
FORCED_API_ALLOWED_FPS = {24, 25, 48, 50}
MULTI_SHOT_LORA_FILENAME = "LTX-2.3_Cinematic_hardcut.safetensors"
MULTI_SHOT_LORA_STRENGTH = "1.0"


def _get_allowed_durations(model_id: str, resolution_label: str, fps: int) -> set[int]:
    if model_id == "ltx-2-3-fast" and resolution_label == "1080p" and fps in {24, 25}:
        return {6, 8, 10, 12, 14, 16, 18, 20}
    return {6, 8, 10}


class VideoGenerationHandler(StateHandlerBase):
    def __init__(
        self,
        state: AppState,
        lock: RLock,
        generation_handler: GenerationHandler,
        pipelines_handler: PipelinesHandler,
        text_handler: TextHandler,
        ltx_api_client: LTXAPIClient,
        outputs_dir: Path,
        config: RuntimeConfig,
        camera_motion_prompts: dict[str, str],
        default_negative_prompt: str,
        wangp_bridge: WanGPBridge,
    ) -> None:
        super().__init__(state, lock)
        self._generation = generation_handler
        self._pipelines = pipelines_handler
        self._text = text_handler
        self._ltx_api_client = ltx_api_client
        self._outputs_dir = outputs_dir
        self._config = config
        self._camera_motion_prompts = camera_motion_prompts
        self._default_negative_prompt = default_negative_prompt
        self._wangp_bridge = wangp_bridge

    def generate(self, req: GenerateVideoRequest) -> GenerateVideoResponse:
        if self._config.wangp_enabled:
            return self._generate_via_wangp(req)

        raise HTTPError(503, "WANGP_REQUIRED: Video generation is only available via WanGP.")

    def generate_video(
        self,
        prompt: str,
        image: Image.Image | None,
        height: int,
        width: int,
        num_frames: int,
        fps: float,
        seed: int,
        camera_motion: VideoCameraMotion,
        negative_prompt: str,
    ) -> str:
        t_total_start = time.perf_counter()
        gen_mode = "i2v" if image is not None else "t2v"
        logger.info("[%s] Generation started (model=fast, %dx%d, %d frames, %d fps)", gen_mode, width, height, num_frames, int(fps))

        if self._generation.is_generation_cancelled():
            raise RuntimeError("Generation was cancelled")

        if not self._config.model_path("checkpoint").exists():
            raise RuntimeError("Models not downloaded. Please download the AI models first using the Model Status menu.")

        total_steps = 8

        self._generation.update_progress("loading_model", 5, 0, total_steps)
        t_load_start = time.perf_counter()
        pipeline_state = self._pipelines.load_gpu_pipeline("fast", should_warm=False)
        t_load_end = time.perf_counter()
        logger.info("[%s] Pipeline load: %.2fs", gen_mode, t_load_end - t_load_start)

        self._generation.update_progress("encoding_text", 10, 0, total_steps)

        enhanced_prompt = prompt + self._camera_motion_prompts.get(camera_motion, "")

        images: list[ImageConditioningInput] = []
        temp_image_path: str | None = None
        if image is not None:
            temp_image_path = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
            image.save(temp_image_path)
            images = [ImageConditioningInput(path=temp_image_path, frame_idx=0, strength=1.0)]

        output_path = self._make_output_path()

        try:
            settings = self.state.app_settings
            use_api_encoding = not self._text.should_use_local_encoding()
            if image is not None:
                enhance = use_api_encoding and settings.prompt_enhancer_enabled_i2v
            else:
                enhance = use_api_encoding and settings.prompt_enhancer_enabled_t2v

            encoding_method = "api" if use_api_encoding else "local"
            t_text_start = time.perf_counter()
            self._text.prepare_text_encoding(enhanced_prompt, enhance_prompt=enhance)
            t_text_end = time.perf_counter()
            logger.info("[%s] Text encoding (%s): %.2fs", gen_mode, encoding_method, t_text_end - t_text_start)

            self._generation.update_progress("inference", 15, 0, total_steps)

            height = round(height / 64) * 64
            width = round(width / 64) * 64

            t_inference_start = time.perf_counter()
            pipeline_state.pipeline.generate(
                prompt=enhanced_prompt,
                seed=seed,
                height=height,
                width=width,
                num_frames=num_frames,
                frame_rate=fps,
                images=images,
                output_path=str(output_path),
            )
            t_inference_end = time.perf_counter()
            logger.info("[%s] Inference: %.2fs", gen_mode, t_inference_end - t_inference_start)

            if self._generation.is_generation_cancelled():
                if output_path.exists():
                    output_path.unlink()
                raise RuntimeError("Generation was cancelled")

            t_total_end = time.perf_counter()
            logger.info("[%s] Total generation: %.2fs (load=%.2fs, text=%.2fs, inference=%.2fs)",
                        gen_mode, t_total_end - t_total_start,
                        t_load_end - t_load_start, t_text_end - t_text_start, t_inference_end - t_inference_start)

            self._generation.update_progress("complete", 100, total_steps, total_steps)
            return str(output_path)
        finally:
            self._text.clear_api_embeddings()
            if temp_image_path and os.path.exists(temp_image_path):
                os.unlink(temp_image_path)

    def _generate_a2v(
        self, req: GenerateVideoRequest, duration: int, fps: int, *, audio_path: str
    ) -> GenerateVideoResponse:
        if req.model != "pro":
            logger.warning("A2V local requested with model=%s; A2V always uses pro pipeline", req.model)
        validated_audio_path = validate_audio_file(audio_path)
        audio_path_str = str(validated_audio_path)

        RESOLUTION_MAP: dict[str, tuple[int, int]] = {
            "540p": (960, 576),
            "720p": (1280, 704),
            "1080p": (1920, 1088),
        }
        width, height = RESOLUTION_MAP.get(req.resolution, (960, 576))

        num_frames = self._compute_num_frames(duration, fps)

        image = None
        temp_image_path: str | None = None
        image_path = normalize_optional_path(req.imagePath)
        if image_path:
            image = self._prepare_image(image_path, width, height)

        seed = self._resolve_seed()

        generation_id = self._make_generation_id()

        try:
            a2v_state = self._pipelines.load_a2v_pipeline()
            self._generation.start_generation(generation_id)

            enhanced_prompt = req.prompt + self._camera_motion_prompts.get(req.cameraMotion, "")
            neg = req.negativePrompt if req.negativePrompt else self._default_negative_prompt

            images: list[ImageConditioningInput] = []
            if image is not None:
                temp_image_path = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
                image.save(temp_image_path)
                images = [ImageConditioningInput(path=temp_image_path, frame_idx=0, strength=1.0)]

            output_path = self._make_output_path()

            total_steps = 11  # distilled: 8 steps (stage 1) + 3 steps (stage 2)

            a2v_settings = self.state.app_settings
            a2v_use_api = not self._text.should_use_local_encoding()
            if image is not None:
                a2v_enhance = a2v_use_api and a2v_settings.prompt_enhancer_enabled_i2v
            else:
                a2v_enhance = a2v_use_api and a2v_settings.prompt_enhancer_enabled_t2v

            self._generation.update_progress("loading_model", 5, 0, total_steps)
            self._generation.update_progress("encoding_text", 10, 0, total_steps)
            self._text.prepare_text_encoding(enhanced_prompt, enhance_prompt=a2v_enhance)
            self._generation.update_progress("inference", 15, 0, total_steps)

            a2v_state.pipeline.generate(
                prompt=enhanced_prompt,
                negative_prompt=neg,
                seed=seed,
                height=height,
                width=width,
                num_frames=num_frames,
                frame_rate=fps,
                num_inference_steps=total_steps,
                images=images,
                audio_path=audio_path_str,
                audio_start_time=0.0,
                audio_max_duration=None,
                output_path=str(output_path),
            )

            if self._generation.is_generation_cancelled():
                if output_path.exists():
                    output_path.unlink()
                raise RuntimeError("Generation was cancelled")

            self._generation.update_progress("complete", 100, total_steps, total_steps)
            self._generation.complete_generation(str(output_path))
            return GenerateVideoResponse(status="complete", video_path=str(output_path))

        except Exception as e:
            self._generation.fail_generation(str(e))
            if "cancelled" in str(e).lower():
                logger.info("Generation cancelled by user")
                return GenerateVideoResponse(status="cancelled")
            raise HTTPError(500, str(e)) from e
        finally:
            self._text.clear_api_embeddings()
            if temp_image_path and os.path.exists(temp_image_path):
                os.unlink(temp_image_path)

    def _prepare_image(self, image_path: str, width: int, height: int) -> Image.Image:
        validated_path = validate_image_file(image_path)
        try:
            img = Image.open(validated_path).convert("RGB")
        except Exception:
            raise HTTPError(400, f"Invalid image file: {image_path}") from None
        img_w, img_h = img.size
        target_ratio = width / height
        img_ratio = img_w / img_h
        if img_ratio > target_ratio:
            new_h = height
            new_w = int(img_w * (height / img_h))
        else:
            new_w = width
            new_h = int(img_h * (width / img_w))
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - width) // 2
        top = (new_h - height) // 2
        return resized.crop((left, top, left + width, top + height))

    @staticmethod
    def _make_generation_id() -> str:
        return uuid.uuid4().hex[:8]

    @staticmethod
    def _compute_num_frames(duration: int, fps: int) -> int:
        n = ((duration * fps) // 8) * 8 + 1
        return max(n, 9)

    def _resolve_seed(self) -> int:
        settings = self.state.app_settings
        if settings.seed_locked:
            logger.info("Using locked seed: %s", settings.locked_seed)
            return settings.locked_seed
        return int(time.time()) % 2147483647

    def _make_output_path(self) -> Path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return self._outputs_dir / f"ltx2_video_{timestamp}_{self._make_generation_id()}.mp4"

    def _generate_forced_api(self, req: GenerateVideoRequest) -> GenerateVideoResponse:
        if self._generation.is_generation_running():
            raise HTTPError(409, "Generation already in progress")

        generation_id = self._make_generation_id()
        self._generation.start_api_generation(generation_id)

        audio_path = normalize_optional_path(req.audioPath)
        image_path = normalize_optional_path(req.imagePath)
        has_input_audio = bool(audio_path)
        has_input_image = bool(image_path)

        try:
            self._generation.update_progress("validating_request", 5, None, None)

            api_key = self.state.app_settings.ltx_api_key.strip()
            logger.info("Forced API generation route selected (key_present=%s)", bool(api_key))
            if not api_key:
                raise HTTPError(400, "PRO_API_KEY_REQUIRED")

            requested_model = req.model.strip().lower()
            api_model_id = FORCED_API_MODEL_MAP.get(requested_model)
            if api_model_id is None:
                raise HTTPError(400, "INVALID_FORCED_API_MODEL")

            resolution_label = req.resolution
            resolution_by_aspect = FORCED_API_RESOLUTION_MAP.get(resolution_label)
            if resolution_by_aspect is None:
                raise HTTPError(400, "INVALID_FORCED_API_RESOLUTION")

            aspect_ratio = req.aspectRatio.strip()
            if aspect_ratio not in FORCED_API_ALLOWED_ASPECT_RATIOS:
                raise HTTPError(400, "INVALID_FORCED_API_ASPECT_RATIO")

            api_resolution = resolution_by_aspect[aspect_ratio]

            prompt = req.prompt

            if self._generation.is_generation_cancelled():
                raise RuntimeError("Generation was cancelled")

            if has_input_audio:
                if requested_model != "pro":
                    logger.warning("A2V requested with model=%s; overriding to 'pro'", requested_model)
                api_model_id = FORCED_API_MODEL_MAP["pro"]
                if api_resolution != A2V_FORCED_API_RESOLUTION:
                    logger.warning("A2V requested with resolution=%s; overriding to '%s'", api_resolution, A2V_FORCED_API_RESOLUTION)
                api_resolution = A2V_FORCED_API_RESOLUTION
                validated_audio_path = validate_audio_file(audio_path)
                validated_image_path: Path | None = None
                if image_path is not None:
                    validated_image_path = validate_image_file(image_path)

                self._generation.update_progress("uploading_audio", 20, None, None)
                audio_uri = self._ltx_api_client.upload_file(
                    api_key=api_key,
                    file_path=str(validated_audio_path),
                )
                image_uri: str | None = None
                if validated_image_path is not None:
                    self._generation.update_progress("uploading_image", 35, None, None)
                    image_uri = self._ltx_api_client.upload_file(
                        api_key=api_key,
                        file_path=str(validated_image_path),
                    )
                self._generation.update_progress("inference", 55, None, None)
                video_bytes = self._ltx_api_client.generate_audio_to_video(
                    api_key=api_key,
                    prompt=prompt,
                    audio_uri=audio_uri,
                    image_uri=image_uri,
                    model=api_model_id,
                    resolution=api_resolution,
                )
                self._generation.update_progress("downloading_output", 85, None, None)
            elif has_input_image:
                validated_image_path = validate_image_file(image_path)

                duration = self._parse_forced_numeric_field(req.duration, "INVALID_FORCED_API_DURATION")
                fps = self._parse_forced_numeric_field(req.fps, "INVALID_FORCED_API_FPS")
                if fps not in FORCED_API_ALLOWED_FPS:
                    raise HTTPError(400, "INVALID_FORCED_API_FPS")
                if duration not in _get_allowed_durations(api_model_id, resolution_label, fps):
                    raise HTTPError(400, "INVALID_FORCED_API_DURATION")

                generate_audio = self._parse_audio_flag(req.audio)
                self._generation.update_progress("uploading_image", 20, None, None)
                image_uri = self._ltx_api_client.upload_file(
                    api_key=api_key,
                    file_path=str(validated_image_path),
                )
                self._generation.update_progress("inference", 55, None, None)
                video_bytes = self._ltx_api_client.generate_image_to_video(
                    api_key=api_key,
                    prompt=prompt,
                    image_uri=image_uri,
                    model=api_model_id,
                    resolution=api_resolution,
                    duration=float(duration),
                    fps=float(fps),
                    generate_audio=generate_audio,
                    camera_motion=req.cameraMotion,
                )
                self._generation.update_progress("downloading_output", 85, None, None)
            else:
                duration = self._parse_forced_numeric_field(req.duration, "INVALID_FORCED_API_DURATION")
                fps = self._parse_forced_numeric_field(req.fps, "INVALID_FORCED_API_FPS")
                if fps not in FORCED_API_ALLOWED_FPS:
                    raise HTTPError(400, "INVALID_FORCED_API_FPS")
                if duration not in _get_allowed_durations(api_model_id, resolution_label, fps):
                    raise HTTPError(400, "INVALID_FORCED_API_DURATION")

                generate_audio = self._parse_audio_flag(req.audio)
                self._generation.update_progress("inference", 55, None, None)
                video_bytes = self._ltx_api_client.generate_text_to_video(
                    api_key=api_key,
                    prompt=prompt,
                    model=api_model_id,
                    resolution=api_resolution,
                    duration=float(duration),
                    fps=float(fps),
                    generate_audio=generate_audio,
                    camera_motion=req.cameraMotion,
                )
                self._generation.update_progress("downloading_output", 85, None, None)

            if self._generation.is_generation_cancelled():
                raise RuntimeError("Generation was cancelled")

            output_path = self._write_forced_api_video(video_bytes)
            if self._generation.is_generation_cancelled():
                output_path.unlink(missing_ok=True)
                raise RuntimeError("Generation was cancelled")

            self._generation.update_progress("complete", 100, None, None)
            self._generation.complete_generation(str(output_path))
            return GenerateVideoResponse(status="complete", video_path=str(output_path))
        except HTTPError as e:
            self._generation.fail_generation(e.detail)
            raise
        except Exception as e:
            self._generation.fail_generation(str(e))
            if "cancelled" in str(e).lower():
                logger.info("Generation cancelled by user")
                return GenerateVideoResponse(status="cancelled")
            raise HTTPError(500, str(e)) from e

    def _write_forced_api_video(self, video_bytes: bytes) -> Path:
        output_path = self._make_output_path()
        output_path.write_bytes(video_bytes)
        return output_path

    def _generate_via_wangp(self, req: GenerateVideoRequest) -> GenerateVideoResponse:
        if self._generation.is_generation_running():
            raise HTTPError(409, "Generation already in progress")

        generation_id = self._make_generation_id()
        self._generation.start_api_generation(generation_id)

        duration = self._parse_forced_numeric_field(req.duration, "INVALID_DURATION")
        fps = self._parse_forced_numeric_field(req.fps, "INVALID_FPS")
        is_reframe = req.reframe is not None
        looks_like_reframe = (
            req.prompt.strip().lower() == "outpaint" and any(
                media.role == "control_video" for media in req.inputMedia
            )
        )
        if looks_like_reframe and not is_reframe:
            raise HTTPError(400, "REFRAME_OPTIONS_REQUIRED")
        if not req.prompt.strip() and not req.shotPrompts and not is_reframe:
            raise HTTPError(400, "PROMPT_REQUIRED")
        if is_reframe:
            reframe = req.reframe
            assert reframe is not None
            duration = max(2, int(math.ceil(reframe.controlVideoDuration)))
            wangp_prompt = req.prompt.strip() or "outpaint"
        else:
            wangp_prompt, duration = self._resolve_prompt_and_duration(req, duration)

        start_image_path = None
        end_image_path = None
        control_video_path = None
        audio_path = normalize_optional_path(req.audioPath)

        video_prompt_type = "VG" if is_reframe else req.videoPromptType
        image_prompt_type = None
        audio_prompt_type = "K" if is_reframe else None

        legacy_image = normalize_optional_path(req.imagePath)
        if legacy_image:
            start_image_path = legacy_image

        for media in req.inputMedia:
            media_path = normalize_optional_path(media.path)
            if not media_path:
                continue
            if media.role == "start_image":
                start_image_path = media_path
            elif media.role == "end_image":
                end_image_path = media_path
            elif media.role == "control_video":
                control_video_path = media_path
            elif media.role == "audio_guide":
                audio_path = media_path
            elif media.role == "human_motion":
                control_video_path = media_path
                video_prompt_type = "PVG"
                if req.useAudioTrack:
                    audio_path = media_path
                    audio_prompt_type = "K"
                else:
                    audio_prompt_type = "2"
            elif media.role == "human_motion_pose":
                control_video_path = media_path
                video_prompt_type = "OVG"
                if req.useAudioTrack:
                    audio_path = media_path
                    audio_prompt_type = "K"
                else:
                    audio_prompt_type = "2"
            elif media.role == "depth":
                control_video_path = media_path
                video_prompt_type = "DVG"
                if req.useAudioTrack:
                    audio_path = media_path
                    audio_prompt_type = "K"
                else:
                    audio_prompt_type = "2"
            elif media.role == "canny_edges":
                control_video_path = media_path
                video_prompt_type = "EVG"
                if req.useAudioTrack:
                    audio_path = media_path
                    audio_prompt_type = "K"
                else:
                    audio_prompt_type = "2"
            elif media.role == "sdr_to_hdr":
                control_video_path = media_path
                video_prompt_type = "V&G"
                if req.useAudioTrack:
                    audio_path = media_path
                    audio_prompt_type = "K"
                else:
                    audio_prompt_type = "2"
            elif media.role == "continue_video":
                start_image_path = media_path
                image_prompt_type = "V"
            elif media.role == "audio_to_video":
                audio_path = media_path
                audio_prompt_type = "A"
            elif media.role == "reference_voice":
                audio_path = media_path
                audio_prompt_type = "A1OF"

        if is_reframe:
            reframe = req.reframe
            assert reframe is not None
            if not control_video_path:
                for media in req.inputMedia:
                    if media.role == "control_video":
                        control_video_path = normalize_optional_path(media.path)
                        break
            if not control_video_path:
                raise HTTPError(400, "REFRAME_CONTROL_VIDEO_REQUIRED")

        temp_clip_path: Path | None = None
        temp_media_paths: list[Path] = []
        video_guide_outpainting: str | None = None
        video_guide_outpainting_ratio: str | None = None
        output_aspect_ratio = req.aspectRatio
        source_video_frame_count: int | None = None
        input_media_duration: float | None = None

        try:
            profile = self._resolve_video_profile(req)
            if is_reframe:
                reframe = req.reframe
                assert reframe is not None
                if not profile.control_video:
                    raise HTTPError(400, "REFRAME_NOT_SUPPORTED")
                if not profile.wangp_metadata.capabilities.get("outpainting", False):
                    raise HTTPError(400, "REFRAME_NOT_SUPPORTED")

            self._validate_video_profile_request(
                profile,
                req,
                start_image_path=start_image_path,
                end_image_path=end_image_path,
                control_video_path=control_video_path,
                audio_path=audio_path,
            )
            resolution_tier = cast(ResolutionTier, req.resolution)
            request_aspect_ratio: AspectRatio = req.aspectRatio
            if is_reframe:
                reframe = req.reframe
                assert reframe is not None
                request_aspect_ratio = reframe.aspectMode if reframe.aspectMode != "custom" else req.aspectRatio
            resolved_width, resolved_height = resolve_resolution(
                profile,
                resolution_tier,
                request_aspect_ratio,
            )
            resolved_resolution_label = f"{resolved_width}x{resolved_height}"

            trimmed_media_paths: dict[str, str] = {}
            for media in req.inputMedia:
                media_path = normalize_optional_path(media.path)
                if not media_path or media.trimDuration is None:
                    continue
                if media.type == "audio":
                    trimmed_path = extract_audio_clip(
                        media_path,
                        start_time=media.trimStartTime or 0.0,
                        duration=media.trimDuration,
                        output_dir=self._outputs_dir,
                    )
                else:
                    trimmed_path = extract_video_clip(
                        media_path,
                        start_time=media.trimStartTime or 0.0,
                        duration=media.trimDuration,
                        output_dir=self._outputs_dir,
                    )
                temp_media_paths.append(trimmed_path)
                trimmed_media_paths[media_path] = str(trimmed_path)
                input_media_duration = media.trimDuration

            if trimmed_media_paths:
                if start_image_path in trimmed_media_paths:
                    start_image_path = trimmed_media_paths[start_image_path]
                if control_video_path in trimmed_media_paths:
                    control_video_path = trimmed_media_paths[control_video_path]
                if audio_path in trimmed_media_paths:
                    audio_path = trimmed_media_paths[audio_path]

            if input_media_duration is not None and not is_reframe and not req.shotPrompts:
                duration = max(2, int(math.ceil(input_media_duration)))

            # continue_video holds a video in start_image_path, so validate as video
            is_start_video = False
            if start_image_path:
                for media in req.inputMedia:
                    original_media_path = normalize_optional_path(media.path)
                    effective_media_path = trimmed_media_paths.get(
                        original_media_path or "",
                        original_media_path,
                    )
                    if media.role == "continue_video" and effective_media_path == start_image_path:
                        is_start_video = True
                        break

            if start_image_path:
                validated_start_image_path = str(validate_video_file(start_image_path)) if is_start_video else str(validate_image_file(start_image_path))
            else:
                validated_start_image_path = None

            validated_end_image_path = str(validate_image_file(end_image_path)) if end_image_path else None
            validated_control_video_path = str(validate_video_file(control_video_path)) if control_video_path else None

            if is_reframe:
                reframe = req.reframe
                assert reframe is not None
                if validated_control_video_path is None:
                    raise HTTPError(400, "REFRAME_SOURCE_REQUIRED")
                source_path = Path(validated_control_video_path)
                temp_clip_path = extract_video_clip(
                    source_path,
                    start_time=reframe.controlVideoStartTime,
                    duration=reframe.controlVideoDuration,
                    output_dir=self._outputs_dir,
                )
                validated_control_video_path = str(temp_clip_path)

                padding = ReframePadding(
                    top=reframe.padding.top,
                    bottom=reframe.padding.bottom,
                    left=reframe.padding.left,
                    right=reframe.padding.right,
                )
                outpaint = map_reframe_to_wangp(
                    reframe.aspectMode,
                    padding,
                )
                video_guide_outpainting = outpaint.video_guide_outpainting
                video_guide_outpainting_ratio = outpaint.video_guide_outpainting_ratio
                output_aspect_ratio = outpaint.output_aspect_ratio
                logger.info(
                    "Reframe outpaint mapping: padding=%s outpainting=%r ratio=%r",
                    padding,
                    video_guide_outpainting,
                    video_guide_outpainting_ratio,
                )

            if validated_control_video_path is not None:
                source_metadata = probe_video_metadata(validated_control_video_path)
                if source_metadata is not None:
                    source_video_frame_count = source_metadata.frame_count
                    logger.info(
                        "Using source video frame count for WanGP video_length: frames=%s duration=%.3fs",
                        source_metadata.frame_count,
                        source_metadata.duration_seconds,
                    )
            if source_video_frame_count is None and is_start_video and validated_start_image_path is not None:
                source_metadata = probe_video_metadata(validated_start_image_path)
                if source_metadata is not None:
                    source_video_frame_count = source_metadata.frame_count
                    logger.info(
                        "Using continue-video frame count for WanGP video_length: frames=%s duration=%.3fs",
                        source_metadata.frame_count,
                        source_metadata.duration_seconds,
                    )

            is_audio_video = False
            if audio_path:
                if any(
                    media.role
                    in {"human_motion", "human_motion_pose", "depth", "canny_edges", "sdr_to_hdr", "control_video"}
                    for media in req.inputMedia
                    if trimmed_media_paths.get(
                        normalize_optional_path(media.path) or "",
                        normalize_optional_path(media.path),
                    )
                    == audio_path
                ):
                    is_audio_video = True

            if audio_path:
                if is_audio_video or audio_path.lower().endswith(('.mp4', '.mov', '.mkv', '.avi', '.webm')):
                    validated_audio_path = str(validate_video_file(audio_path))
                else:
                    validated_audio_path = str(validate_audio_file(audio_path))
            else:
                validated_audio_path = None

            settings = self.state.app_settings.model_copy(deep=True)
            default_steps = profile.wangp_default_settings.get("num_inference_steps")
            if isinstance(default_steps, int):
                steps = max(1, default_steps)
            else:
                steps = 8 if req.model.strip().lower() == "fast" else max(1, settings.pro_model.steps)
            seed = self._resolve_seed()
            default_settings = dict(profile.wangp_default_settings)
            output_settings = settings.output_settings
            default_settings.update(
                {
                    "video_output_codec": output_settings.video_codec,
                    "video_container": output_settings.video_container,
                    "audio_output_codec": output_settings.audio_codec,
                    "image_output_codec": f"{output_settings.image_codec}_{output_settings.image_quality}"
                    if output_settings.image_codec in {"jpeg", "webp"}
                    else output_settings.image_codec,
                    "metadata_type": output_settings.metadata_mode,
                    "keep_intermediate_sliding_windows": 1
                    if output_settings.keep_intermediate_sliding_windows
                    else 0,
                }
            )
            if req.shotPrompts:
                default_settings["activated_loras"] = [MULTI_SHOT_LORA_FILENAME]
                default_settings["loras_multipliers"] = MULTI_SHOT_LORA_STRENGTH
            if is_reframe:
                default_settings["force_fps"] = "auto"
                default_settings["sliding_window_overlap"] = 33

            output_path = self._wangp_bridge.generate_video(
                prompt=wangp_prompt,
                resolution_label=resolved_resolution_label,
                aspect_ratio=output_aspect_ratio,
                duration_seconds=duration,
                fps=fps,
                steps=steps,
                seed=seed,
                camera_motion=req.cameraMotion,
                negative_prompt=req.negativePrompt,
                image_path=validated_start_image_path,
                audio_path=validated_audio_path,
                on_progress=self._generation.update_progress,
                is_cancelled=self._generation.is_generation_cancelled,
                model_type=profile.wangp_model_type,
                default_settings=default_settings,
                start_image_path=validated_start_image_path,
                end_image_path=validated_end_image_path,
                control_video_path=validated_control_video_path,
                video_prompt_type=video_prompt_type,
                image_prompt_type=image_prompt_type,
                audio_prompt_type=audio_prompt_type,
                video_guide_outpainting=video_guide_outpainting,
                video_guide_outpainting_ratio=video_guide_outpainting_ratio,
                video_length_frames=source_video_frame_count,
            )

            self._generation.complete_generation(output_path)
            return GenerateVideoResponse(status="complete", video_path=output_path)
        except HTTPError as e:
            # Validation errors (400) and conflict errors (409) are intentional
            # client responses — propagate them unchanged instead of masking
            # them as 500 internal errors.
            self._generation.fail_generation(e.detail)
            raise
        except Exception as e:
            self._generation.fail_generation(str(e))
            if "cancelled" in str(e).lower():
                logger.info("WanGP generation cancelled by user")
                return GenerateVideoResponse(status="cancelled")
            raise HTTPError(500, str(e)) from e
        finally:
            if temp_clip_path is not None and temp_clip_path.exists():
                try:
                    temp_clip_path.unlink()
                except OSError:
                    logger.warning("Could not remove temporary reframe clip: %s", temp_clip_path)
            for media_path in temp_media_paths:
                if not media_path.exists():
                    continue
                try:
                    media_path.unlink()
                except OSError:
                    logger.warning("Could not remove temporary input clip: %s", media_path)

    @staticmethod
    def _resolve_video_profile(req: GenerateVideoRequest) -> ModelProfile:
        profile_id = req.modelProfileId
        if not profile_id:
            # Backwards compatibility for existing clients.
            legacy_model = req.model.strip().lower()
            if legacy_model == "fast":
                profile_id = "ltx2_22b_distilled"
        if not profile_id:
            raise HTTPError(400, "UNKNOWN_VIDEO_MODEL_PROFILE")
        profile = get_video_profile(profile_id)
        if profile is None or not profile.visible:
            raise HTTPError(400, "UNKNOWN_VIDEO_MODEL_PROFILE")
        return profile

    @staticmethod
    def _resolve_prompt_and_duration(req: GenerateVideoRequest, duration: int) -> tuple[str, int]:
        if not req.shotPrompts:
            return req.prompt, duration

        cursor = 0
        relayed_prompts: list[str] = []
        for shot in req.shotPrompts:
            start = cursor
            cursor += shot.seconds
            relayed_prompts.append(f"[{start}s:{cursor}s] {shot.prompt}")

        if cursor > 20:
            raise HTTPError(400, "MULTI_SHOT_DURATION_TOO_LONG")
        lines = [req.prompt.strip(), *relayed_prompts] if req.prompt.strip() else relayed_prompts
        return "\n".join(lines), cursor

    @staticmethod
    def _validate_video_profile_request(
        profile: ModelProfile,
        req: GenerateVideoRequest,
        *,
        start_image_path: str | None = None,
        end_image_path: str | None = None,
        control_video_path: str | None = None,
        audio_path: str | None = None,
    ) -> None:
        if req.resolution not in profile.allowed_resolution_tiers:
            raise HTTPError(400, "UNSUPPORTED_VIDEO_RESOLUTION_TIER")
        if req.aspectRatio not in profile.allowed_aspect_ratios:
            raise HTTPError(400, "UNSUPPORTED_VIDEO_ASPECT_RATIO")
        if not is_combination_supported(profile, req.resolution, req.aspectRatio):
            raise HTTPError(400, "NO_CURATED_VIDEO_RESOLUTION")

        if req.inputMedia and profile.input_media and profile.input_media.supports_image_inputs:
            allowed_roles = {role_def.role for role_def in profile.input_media.roles}
            if profile.start_image:
                allowed_roles.add("start_image")
            if profile.end_image:
                allowed_roles.add("end_image")
            if profile.control_video:
                allowed_roles.add("control_video")
            if profile.audio_to_video:
                allowed_roles.add("audio_guide")
            for media in req.inputMedia:
                if media.role not in allowed_roles:
                    raise HTTPError(400, f"Role {media.role} is not supported by this model profile")

        if start_image_path and not (profile.start_image or profile.image_to_video or profile.video_continuation):
            raise HTTPError(400, "VIDEO_IMAGE_INPUT_NOT_SUPPORTED")
        if end_image_path and not profile.end_image:
            raise HTTPError(400, "VIDEO_IMAGE_INPUT_NOT_SUPPORTED")
        if control_video_path and not profile.control_video:
            raise HTTPError(400, "VIDEO_IMAGE_INPUT_NOT_SUPPORTED")
        if audio_path and not profile.audio_to_video:
            raise HTTPError(400, "VIDEO_AUDIO_INPUT_NOT_SUPPORTED")

    @staticmethod
    def _parse_forced_numeric_field(raw_value: str, error_detail: str) -> int:
        try:
            return int(float(raw_value))
        except (TypeError, ValueError):
            raise HTTPError(400, error_detail) from None

    @staticmethod
    def _parse_audio_flag(audio_value: str | bool) -> bool:
        if isinstance(audio_value, bool):
            return audio_value
        normalized = audio_value.strip().lower()
        return normalized in {"1", "true", "yes", "on"}
