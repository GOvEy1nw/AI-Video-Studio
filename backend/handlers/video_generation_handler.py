"""Video generation orchestration handler."""

from __future__ import annotations

import logging
import math
import time
import uuid
from pathlib import Path
from threading import RLock
from typing import TYPE_CHECKING, cast

from api_types import GenerateVideoRequest, GenerateVideoResponse
from _routes._errors import HTTPError
from handlers.base import StateHandlerBase
from handlers.generation_handler import GenerationHandler
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
from state.app_state_types import AppState

if TYPE_CHECKING:
    from runtime_config.runtime_config import RuntimeConfig

logger = logging.getLogger(__name__)

MULTI_SHOT_LORA_FILENAME = "LTX-2.3_Cinematic_hardcut.safetensors"
MULTI_SHOT_LORA_STRENGTH = "1.0"


class VideoGenerationHandler(StateHandlerBase):
    def __init__(
        self,
        state: AppState,
        lock: RLock,
        generation_handler: GenerationHandler,
        outputs_dir: Path,
        config: RuntimeConfig,
        wangp_bridge: WanGPBridge,
    ) -> None:
        super().__init__(state, lock)
        self._generation = generation_handler
        self._outputs_dir = outputs_dir
        self._config = config
        self._wangp_bridge = wangp_bridge

    def generate(self, req: GenerateVideoRequest) -> GenerateVideoResponse:
        if self._config.wangp_enabled:
            return self._generate_via_wangp(req)

        raise HTTPError(503, "WANGP_REQUIRED: Video generation is only available via WanGP.")

    @staticmethod
    def _make_generation_id() -> str:
        return uuid.uuid4().hex[:8]

    def _resolve_seed(self) -> int:
        settings = self.state.app_settings
        if settings.seed_locked:
            logger.info("Using locked seed: %s", settings.locked_seed)
            return settings.locked_seed
        return int(time.time()) % 2147483647

    def _generate_via_wangp(self, req: GenerateVideoRequest) -> GenerateVideoResponse:
        if self._generation.is_generation_running():
            raise HTTPError(409, "Generation already in progress")

        generation_id = self._make_generation_id()
        self._generation.start_generation_job(generation_id)

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
                if media.role != "continue_video":
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
                    source_video_frame_count = source_metadata.frame_count + duration * fps
                    logger.info(
                        "Extending continue-video for %ss: source_frames=%s output_frames=%s source_duration=%.3fs",
                        duration,
                        source_metadata.frame_count,
                        source_video_frame_count,
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
