"""Curated ACE-Step text-to-music generation orchestration."""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from threading import RLock

from _routes._errors import HTTPError
from api_types import (
    GenerateMusicRequest,
    GenerateMusicResponse,
    MusicOutputResponse,
)
from handlers.base import StateHandlerBase
from handlers.generation_handler import GenerationHandler
from model_profiles import get_image_profile, get_music_profile, get_video_profile
from model_profiles.profiles import ModelProfile
from services.audio_metadata import probe_audio_metadata
from services.wangp_bridge import WanGPBridge
from state.app_state_types import AppState

_KEY_SCALE_RE = re.compile(
    r"^([A-Ga-g])\s*([#b♯♭]?)\s*(major|minor|maj|min|m)$",
    re.IGNORECASE,
)


def normalize_key_scale(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    match = _KEY_SCALE_RE.fullmatch(value.strip())
    if match is None:
        raise HTTPError(400, "MUSIC_KEY_SCALE_INVALID: Use a key such as C major or F# minor.")
    note = match.group(1).upper()
    accidental = match.group(2).replace("♯", "#").replace("♭", "b")
    raw_mode = match.group(3).casefold()
    mode = "major" if raw_mode in {"major", "maj"} else "minor"
    return f"{note}{accidental} {mode}"


class MusicGenerationHandler(StateHandlerBase):
    def __init__(
        self,
        state: AppState,
        lock: RLock,
        generation_handler: GenerationHandler,
        outputs_dir: Path,
        wangp_bridge: WanGPBridge,
    ) -> None:
        super().__init__(state, lock)
        self._generation = generation_handler
        self._outputs_dir = outputs_dir.resolve()
        self._wangp_bridge = wangp_bridge

    def generate(self, req: GenerateMusicRequest) -> GenerateMusicResponse:
        if self._generation.is_generation_running():
            raise HTTPError(409, "Generation already in progress")
        if not self._wangp_bridge.get_status().available:
            raise HTTPError(503, "WANGP_UNAVAILABLE: WanGP is not available.")

        profile = self._validate_profile_and_request(req)
        generation_id = uuid.uuid4().hex[:8]
        self._generation.start_generation_job(generation_id)
        outputs: list[MusicOutputResponse] = []
        created_paths: list[Path] = []

        try:
            resolved_lyrics, response_lyrics = self._resolve_lyrics(req, profile)
            if req.vocalMode != "auto-lyrics":
                self._generation.update_progress("preparing_music", 0)
            settings = self.state.app_settings.model_copy(deep=True)
            base_seed = settings.locked_seed if settings.seed_locked else None

            for variation_index in range(req.variations):
                if self._generation.is_generation_cancelled():
                    raise HTTPError(409, "GENERATION_CANCELLED: Music generation was cancelled.")
                seed = base_seed + variation_index if base_seed is not None else None

                def on_progress(
                    phase: str,
                    progress: int,
                    *detail: object,
                    _variation_index: int = variation_index,
                ) -> None:
                    aggregate = round(
                        ((_variation_index + progress / 100.0) / req.variations) * 100
                    )
                    self._generation.update_progress(
                        phase,
                        aggregate,
                        section_index=_variation_index + 1,
                        section_count=req.variations,
                        status_detail=(
                            str(detail[0]) if detail and isinstance(detail[0], str) else None
                        ),
                    )

                path = self._wangp_bridge.generate_music(
                    description=req.description,
                    lyrics=resolved_lyrics,
                    duration_seconds=req.durationSeconds,
                    bpm=req.bpm,
                    key_scale=normalize_key_scale(req.keyScale),
                    time_signature=req.timeSignature,
                    auto_fill_metadata=req.autoFillMetadata,
                    seed=seed,
                    model_type=profile.wangp_model_type,
                    default_settings=dict(profile.wangp_default_settings),
                    on_progress=on_progress,
                    is_cancelled=self._generation.is_generation_cancelled,
                )
                output_path = Path(path).resolve()
                created_paths.append(output_path)
                self._generation.update_progress(
                    "saving_output",
                    round(((variation_index + 1) / req.variations) * 100),
                    section_index=variation_index + 1,
                    section_count=req.variations,
                )
                metadata = probe_audio_metadata(output_path)
                outputs.append(
                    MusicOutputResponse(
                        path=str(output_path),
                        durationSeconds=metadata.duration_seconds,
                        sampleRate=metadata.sample_rate,
                        channels=metadata.channels,
                        format=metadata.format,
                        variationIndex=variation_index,
                        seed=seed,
                    )
                )

            self._generation.complete_generation([output.path for output in outputs])
            return GenerateMusicResponse(
                status="success",
                outputs=outputs,
                resolvedLyrics=response_lyrics,
            )
        except HTTPError as exc:
            self._cleanup_outputs(created_paths)
            if not self._generation.is_generation_cancelled():
                self._generation.fail_generation(exc.detail)
            raise
        except Exception as exc:
            self._cleanup_outputs(created_paths)
            if self._generation.is_generation_cancelled():
                raise HTTPError(409, "GENERATION_CANCELLED: Music generation was cancelled.") from exc
            self._generation.fail_generation(str(exc))
            raise HTTPError(500, f"MUSIC_GENERATION_FAILED: {exc}") from exc

    def _validate_profile_and_request(self, req: GenerateMusicRequest) -> ModelProfile:
        profile = (
            get_music_profile(req.modelProfileId)
            or get_image_profile(req.modelProfileId)
            or get_video_profile(req.modelProfileId)
        )
        if profile is None:
            raise HTTPError(404, "UNKNOWN_MODEL_PROFILE: Unknown music model profile.")
        if not profile.visible:
            raise HTTPError(404, "MODEL_PROFILE_HIDDEN: Music model profile is hidden.")
        if profile.media_type != "audio":
            raise HTTPError(400, "MODEL_PROFILE_NOT_MUSIC: Profile is not an audio model.")
        policy = profile.music
        if not policy.enabled or not profile.text_to_audio:
            raise HTTPError(400, "MUSIC_MODE_UNSUPPORTED: Profile does not support music.")
        supported_modes = {
            "instrumental": policy.supports_instrumental,
            "auto-lyrics": policy.supports_auto_lyrics,
            "custom-lyrics": policy.supports_custom_lyrics,
        }
        if not supported_modes[req.vocalMode]:
            raise HTTPError(400, "MUSIC_MODE_UNSUPPORTED: Vocal mode is unsupported.")
        if not policy.duration_min_seconds <= req.durationSeconds <= policy.duration_max_seconds:
            raise HTTPError(400, "MUSIC_DURATION_OUT_OF_RANGE: Duration is outside profile bounds.")
        if req.variations > policy.max_variations:
            raise HTTPError(400, "MUSIC_VARIATIONS_OUT_OF_RANGE: Too many variations.")
        if req.bpm is not None and (
            not policy.supports_bpm or not policy.bpm_min <= req.bpm <= policy.bpm_max
        ):
            raise HTTPError(400, "MUSIC_BPM_OUT_OF_RANGE: BPM is outside profile bounds.")
        if req.timeSignature is not None and (
            not policy.supports_time_signature
            or req.timeSignature not in policy.time_signatures
        ):
            raise HTTPError(400, "MUSIC_TIME_SIGNATURE_UNSUPPORTED: Unsupported time signature.")
        if req.keyScale is not None and not policy.supports_key_scale:
            raise HTTPError(400, "MUSIC_KEY_SCALE_INVALID: Key/scale is unsupported.")
        normalize_key_scale(req.keyScale)
        return profile

    def _resolve_lyrics(
        self, req: GenerateMusicRequest, profile: ModelProfile
    ) -> tuple[str, str | None]:
        if req.vocalMode == "instrumental":
            return "[Instrumental]", None
        if req.vocalMode == "custom-lyrics":
            if req.lyrics is None:
                raise HTTPError(400, "CUSTOM_LYRICS_REQUIRED: Custom lyrics are required.")
            return req.lyrics, req.lyrics
        self._generation.update_progress("composing_lyrics", 0)
        try:
            lyrics = self._wangp_bridge.compose_music_lyrics(
                description=req.description,
                duration_seconds=req.durationSeconds,
                model_type=profile.wangp_model_type,
            )
        except Exception as exc:
            raise HTTPError(
                503,
                "AUTO_LYRICS_UNAVAILABLE: Auto Lyrics needs the Prompt Enhancer model pack.",
            ) from exc
        self._generation.update_progress("preparing_music", 5)
        return lyrics, lyrics

    def _cleanup_outputs(self, paths: list[Path]) -> None:
        for path in paths:
            try:
                if path.is_relative_to(self._outputs_dir):
                    path.unlink(missing_ok=True)
            except OSError:
                continue
