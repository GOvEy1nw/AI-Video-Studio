"""Pure Director semantic compiler. No filesystem or WanGP imports."""

from __future__ import annotations

import re
from dataclasses import dataclass

from api_types import (
    DirectorPromptSegmentInput,
    GenerateDirectorRequest,
)
from model_profiles.profiles import DirectorPolicy


class DirectorValidationError(ValueError):
    def __init__(self, code: str, detail: str = "") -> None:
        self.code = code
        self.detail = detail
        super().__init__(f"{code}: {detail}" if detail else code)


@dataclass(frozen=True)
class DirectorInjectedFrame:
    path: str
    frame: int
    strength: float


@dataclass(frozen=True)
class DirectorWanGPPlan:
    compiled_prompt: str
    output_frame_count: int
    duration_seconds: float
    start_image_path: str | None
    end_image_path: str | None
    injected_frames: tuple[DirectorInjectedFrame, ...]
    continue_video_path: str | None
    control_video_path: str | None
    ingredients_image_path: str | None
    guide_audio_path: str | None
    image_prompt_type: str | None
    video_prompt_type: str | None
    audio_prompt_type: str | None
    warnings: tuple[str, ...]


_MANUAL_RELAY = re.compile(
    r"\[(?:\d+(?:\.\d+)?(?:s|%)?):(?:\d+(?:\.\d+)?(?:s|%)?)?\]",
    re.IGNORECASE,
)


def snap_ltx_frames_up(requested_frames: int | float) -> int:
    safe = max(1, int(-(-float(requested_frames) // 1)))
    return max(9, ((safe - 1 + 7) // 8) * 8 + 1)


def resolve_keyframe_frame(segment: DirectorPromptSegmentInput) -> int:
    if segment.keyframe is None:
        raise DirectorValidationError(
            "DIRECTOR_MISSING_ASSET", f"segment {segment.id} has no keyframe"
        )
    last_frame = segment.endFrameExclusive - 1
    point = segment.keyframe.point.value
    if point == "start":
        return segment.startFrame
    if point == "centre":
        return (segment.startFrame + last_frame) // 2
    return last_frame


def _raise(code: str, detail: str = "") -> None:
    raise DirectorValidationError(code, detail)


def _validated_segments(
    request: GenerateDirectorRequest,
    output_frame_count: int,
) -> list[DirectorPromptSegmentInput]:
    if not request.promptSegments:
        _raise("DIRECTOR_PROMPT_REQUIRED")
    segments = sorted(request.promptSegments, key=lambda segment: segment.startFrame)
    expected_start = request.continueVideo.timelineDurationFrames if request.continueVideo else 0
    if expected_start >= output_frame_count:
        _raise("DIRECTOR_INVALID_FRAME_RANGE", "source prefix consumes output")
    previous_end = expected_start
    normalized: list[DirectorPromptSegmentInput] = []
    for segment in segments:
        if segment.startFrame < previous_end:
            _raise("DIRECTOR_PROMPT_OVERLAP", segment.id)
        if segment.endFrameExclusive <= segment.startFrame:
            _raise("DIRECTOR_INVALID_FRAME_RANGE", segment.id)
        if segment.endFrameExclusive > request.durationFrames:
            _raise("DIRECTOR_INVALID_FRAME_RANGE", segment.id)
        normalized.append(segment)
        previous_end = segment.endFrameExclusive
    return normalized


def _compile_prompt(
    global_prompt: str,
    segments: list[DirectorPromptSegmentInput],
    visible_frame_offset: int,
    output_frame_count: int,
) -> str:
    global_text = global_prompt.strip()
    if _MANUAL_RELAY.search(global_text):
        _raise("DIRECTOR_MANUAL_RELAY_NOT_ALLOWED")
    lines = [global_text] if global_text else []
    for index, segment in enumerate(segments):
        local = segment.prompt.strip() or global_text
        if not local:
            _raise("DIRECTOR_PROMPT_REQUIRED", segment.id)
        if _MANUAL_RELAY.search(local):
            _raise("DIRECTOR_MANUAL_RELAY_NOT_ALLOWED", segment.id)
        effective_end = (
            segments[index + 1].startFrame
            if index + 1 < len(segments)
            else output_frame_count
        )
        relay_start = segment.startFrame - visible_frame_offset + 1
        relay_end = effective_end - visible_frame_offset
        if relay_start < 1 or relay_end < relay_start:
            _raise("DIRECTOR_INVALID_FRAME_RANGE", segment.id)
        lines.append(f"[{relay_start}:{relay_end}] {local}")
    return "\n".join(lines)


def compile_director_request(
    request: GenerateDirectorRequest,
    policy: DirectorPolicy,
) -> DirectorWanGPPlan:
    if not policy.enabled:
        _raise("DIRECTOR_PROFILE_NOT_SUPPORTED")
    if request.requestedDurationSeconds > policy.max_duration_seconds:
        _raise("DIRECTOR_DURATION_TOO_LONG")
    if request.fps != 24:
        _raise("DIRECTOR_WANGP_MAPPING_UNAVAILABLE", "Director V1 requires 24 fps")
    if not request.generateAudio:
        _raise("DIRECTOR_WANGP_MAPPING_UNAVAILABLE", "audio-disabled output")

    output_frame_count = snap_ltx_frames_up(request.durationFrames)
    if (output_frame_count - 1) / request.fps > policy.max_duration_seconds:
        _raise("DIRECTOR_DURATION_TOO_LONG")
    continue_video = request.continueVideo
    if continue_video and continue_video.timelineDurationFrames != snap_ltx_frames_up(
        continue_video.trimDuration * request.fps
    ):
        _raise("DIRECTOR_INVALID_FRAME_RANGE", "Continue Video duration mismatch")
    segments = _validated_segments(request, output_frame_count)
    if len(segments) > 1 and not policy.prompt_relay:
        _raise("DIRECTOR_WANGP_MAPPING_UNAVAILABLE", "Prompt Relay")
    visible_offset = continue_video.timelineDurationFrames if continue_video else 0
    compiled_prompt = _compile_prompt(
        request.globalPrompt, segments, visible_offset, output_frame_count
    )

    start_image_path: str | None = None
    end_image_path: str | None = None
    injected: list[DirectorInjectedFrame] = []
    occupied: dict[int, str] = {}
    warnings: list[str] = []
    for segment in segments:
        keyframe = segment.keyframe
        if keyframe is None:
            continue
        frame = resolve_keyframe_frame(segment)
        if frame in occupied:
            _raise(
                "DIRECTOR_DUPLICATE_KEYFRAME_FRAME",
                f"{occupied[frame]} and {segment.id} resolve to {frame}",
            )
        occupied[frame] = segment.id
        injected.append(
            DirectorInjectedFrame(
                path=keyframe.path,
                frame=frame,
                strength=keyframe.strength,
            )
        )
    keyframe_count = len(occupied)
    if policy.max_image_keyframes is not None and keyframe_count > policy.max_image_keyframes:
        _raise("DIRECTOR_TOO_MANY_KEYFRAMES")
    if injected and not policy.injected_frames:
        _raise("DIRECTOR_WANGP_MAPPING_UNAVAILABLE", "injected frames")
    if len({frame.strength for frame in injected}) > 1:
        _raise(
            "DIRECTOR_WANGP_MAPPING_UNAVAILABLE",
            "injected frames require one shared strength",
        )
    if continue_video and not policy.continue_video:
        _raise("DIRECTOR_GUIDANCE_COMBINATION_NOT_SUPPORTED", "Continue Video")
    guidance = request.guidance
    if (
        guidance
        and guidance.mode != "ingredients"
        and guidance.timelineDurationFrames is not None
        and guidance.timelineDurationFrames != output_frame_count
    ):
        _raise("DIRECTOR_INVALID_FRAME_RANGE", "guidance duration mismatch")
    if guidance and guidance.strength != 1:
        _raise("DIRECTOR_WANGP_MAPPING_UNAVAILABLE", "guidance strength")
    if guidance and policy.max_guidance_segments < 1:
        _raise("DIRECTOR_GUIDANCE_NOT_SUPPORTED", guidance.mode)
    if (
        continue_video
        and continue_video.useSourceAudio
        and guidance
        and guidance.mode != "ingredients"
        and guidance.useSourceAudio
    ):
        _raise("DIRECTOR_AUDIO_SOURCE_CONFLICT")
    control_video_path: str | None = None
    ingredients_image_path: str | None = None
    video_prompt_type: str | None = "KFI" if injected else None
    if guidance:
        if guidance.mode not in policy.guidance_modes:
            _raise("DIRECTOR_GUIDANCE_NOT_SUPPORTED", guidance.mode)
        if continue_video:
            _raise("DIRECTOR_GUIDANCE_COMBINATION_NOT_SUPPORTED", "Continue Video + guidance")
        if keyframe_count:
            allowed = (
                policy.allow_keyframes_with_ingredients
                if guidance.mode == "ingredients"
                else policy.allow_keyframes_with_video_guidance
            )
            if not allowed:
                _raise("DIRECTOR_GUIDANCE_COMBINATION_NOT_SUPPORTED", "keyframes + guidance")
        if guidance.mode == "ingredients":
            description = guidance.referenceDescription.strip()
            if not description:
                _raise("DIRECTOR_INGREDIENTS_DESCRIPTION_REQUIRED")
            ingredients_image_path = guidance.path
            compiled_prompt = f"{compiled_prompt}\nReference description: {description}"
            video_prompt_type = "I"
        else:
            control_video_path = guidance.path
            video_prompt_type = "PVG" if guidance.mode == "human_motion" else "DVG"

    guide_audio_is_active = bool(
        request.guideAudio
        and not (continue_video and continue_video.useSourceAudio)
        and not (guidance and guidance.mode != "ingredients" and guidance.useSourceAudio)
    )
    if guide_audio_is_active and not policy.guide_audio_start_only:
        _raise("DIRECTOR_GUIDANCE_NOT_SUPPORTED", "Guide Audio")
    if guide_audio_is_active and request.guideAudio and request.guideAudio.strength != 1:
        _raise("DIRECTOR_WANGP_MAPPING_UNAVAILABLE", "Guide Audio strength")
    if guidance and guide_audio_is_active and not policy.allow_guide_audio_with_guidance:
        _raise("DIRECTOR_GUIDANCE_COMBINATION_NOT_SUPPORTED", "Guide Audio + guidance")

    guide_audio_path: str | None = None
    audio_prompt_type: str | None = None
    if continue_video and continue_video.useSourceAudio:
        guide_audio_path = continue_video.path
        audio_prompt_type = "K"
    elif guidance and guidance.mode != "ingredients" and guidance.useSourceAudio:
        guide_audio_path = guidance.path
        audio_prompt_type = "K"
    elif request.guideAudio:
        guide_audio_path = request.guideAudio.path
        audio_prompt_type = "A"

    image_prompt_type = "V" if continue_video else None

    return DirectorWanGPPlan(
        compiled_prompt=compiled_prompt,
        output_frame_count=output_frame_count,
        duration_seconds=(output_frame_count - 1) / request.fps,
        start_image_path=start_image_path,
        end_image_path=end_image_path,
        injected_frames=tuple(injected),
        continue_video_path=continue_video.path if continue_video else None,
        control_video_path=control_video_path,
        ingredients_image_path=ingredients_image_path,
        guide_audio_path=guide_audio_path,
        image_prompt_type=image_prompt_type,
        video_prompt_type=video_prompt_type,
        audio_prompt_type=audio_prompt_type,
        warnings=tuple(warnings),
    )
