"""Curated MMAudio sound-effect generation orchestration."""

from __future__ import annotations

import math
import uuid
from pathlib import Path
from threading import RLock

from _routes._errors import HTTPError
from api_types import GenerateSfxRequest, GenerateSfxResponse
from handlers.base import StateHandlerBase
from handlers.generation_handler import GenerationHandler
from model_profiles import get_music_profile
from model_profiles.profiles import ModelProfile
from services.video_clip import create_black_video_clip, extract_video_clip, probe_video_metadata
from services.wangp_bridge import WanGPBridge
from server_utils.media_validation import validate_video_file
from state.app_state_types import AppState


class SfxGenerationHandler(StateHandlerBase):
    def __init__(self, state: AppState, lock: RLock, generation_handler: GenerationHandler, outputs_dir: Path, wangp_bridge: WanGPBridge) -> None:
        super().__init__(state, lock)
        self._generation = generation_handler
        self._outputs_dir = outputs_dir.resolve()
        self._wangp_bridge = wangp_bridge

    def generate(self, req: GenerateSfxRequest) -> GenerateSfxResponse:
        if not self._wangp_bridge.get_status().available:
            raise HTTPError(503, "WANGP_UNAVAILABLE: WanGP is not available.")
        profile = self._validate_profile(req)
        output_path = self._outputs_dir / f"mmaudio_sfx_{uuid.uuid4().hex[:8]}.wav"
        temporary_paths: list[Path] = []
        try:
            self._generation.start_generation_job(f"sfx-{uuid.uuid4().hex[:8]}")
        except RuntimeError as exc:
            raise HTTPError(409, "Generation already in progress") from exc
        try:
            if self._generation.is_generation_cancelled():
                return GenerateSfxResponse(status="cancelled")
            self._generation.update_progress("preparing_sfx", 0)
            video_path, duration, temporary_paths = self._prepare_conditioning(req, profile)
            if self._generation.is_generation_cancelled():
                return GenerateSfxResponse(status="cancelled")
            self._wangp_bridge.generate_sfx(
                video_path=str(video_path), prompt=req.prompt, negative_prompt=req.negativePrompt.strip(),
                seed=req.seed, duration_seconds=duration, output_path=output_path,
                on_progress=self._generation.update_progress,
            )
            if self._generation.is_generation_cancelled():
                output_path.unlink(missing_ok=True)
                return GenerateSfxResponse(status="cancelled")
            self._generation.complete_generation(str(output_path))
            return GenerateSfxResponse(status="complete", audio_path=str(output_path), resolvedSeed=req.seed)
        except HTTPError as exc:
            output_path.unlink(missing_ok=True)
            if self._generation.is_generation_cancelled():
                return GenerateSfxResponse(status="cancelled")
            self._generation.fail_generation(exc.detail)
            raise
        except Exception as exc:
            output_path.unlink(missing_ok=True)
            if self._generation.is_generation_cancelled():
                return GenerateSfxResponse(status="cancelled")
            self._generation.fail_generation(str(exc))
            raise HTTPError(500, f"SFX_GENERATION_FAILED: {exc}") from exc
        finally:
            for path in temporary_paths:
                path.unlink(missing_ok=True)

    def _validate_profile(self, req: GenerateSfxRequest) -> ModelProfile:
        profile = get_music_profile(req.modelProfileId)
        if profile is None or not profile.visible:
            raise HTTPError(404, "SFX_PROFILE_NOT_FOUND: Unknown SFX model profile.")
        if profile.media_type != "audio" or not profile.sfx.text or profile.sfx.handler != "sfx_generation":
            raise HTTPError(400, "SFX_MODE_UNSUPPORTED: Profile does not support SFX generation.")
        if profile.sfx.max_duration_seconds is not None and req.durationSeconds > profile.sfx.max_duration_seconds:
            raise HTTPError(400, "SFX_DURATION_OUT_OF_RANGE: Duration is outside profile bounds.")
        return profile

    def _prepare_conditioning(self, req: GenerateSfxRequest, profile: ModelProfile) -> tuple[Path, int, list[Path]]:
        if req.video is None:
            black = create_black_video_clip(duration=req.durationSeconds, output_dir=self._outputs_dir)
            return black, req.durationSeconds, [black]
        if not profile.sfx.control_video_audio:
            raise HTTPError(400, "SFX_VIDEO_UNSUPPORTED: Video conditioning is unsupported.")
        source = validate_video_file(req.video.path)
        metadata = probe_video_metadata(source)
        if metadata is None:
            raise HTTPError(400, "SFX_VIDEO_UNREADABLE: Could not read source video duration.")
        start = req.video.trimStartTime or 0.0
        available = metadata.duration_seconds - start
        if available <= 0:
            raise HTTPError(400, "SFX_VIDEO_TRIM_OUT_OF_RANGE: Video trim starts after the source.")
        requested = (
            req.video.trimDuration
            if req.video.trimDuration is not None
            else min(float(req.durationSeconds), available)
        )
        if requested > available + 1e-6:
            raise HTTPError(400, "SFX_VIDEO_TRIM_OUT_OF_RANGE: Video trim exceeds the source.")
        if requested < 1:
            raise HTTPError(400, "SFX_VIDEO_TRIM_OUT_OF_RANGE: At least one second of video is required.")
        duration = min(req.durationSeconds, int(math.floor(requested)))
        if start == 0 and req.video.trimDuration is None:
            return source, duration, []
        trimmed = extract_video_clip(source, start_time=start, duration=requested, output_dir=self._outputs_dir)
        return trimmed, duration, [trimmed]
