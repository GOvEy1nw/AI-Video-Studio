from __future__ import annotations

from dataclasses import replace

import pytest

from api_types import DirectorPromptSegmentInput, GenerateDirectorRequest
from model_profiles import get_video_profile
from services.director_compiler import (
    DirectorValidationError,
    compile_director_request,
    resolve_keyframe_frame,
    snap_ltx_frames_up,
)


def _request(**updates: object) -> GenerateDirectorRequest:
    payload: dict[str, object] = {
        "schemaVersion": 1,
        "modelProfileId": "ltx2_22b_distilled",
        "resolutionTier": "540p",
        "aspectRatio": "16:9",
        "fps": 24,
        "requestedDurationSeconds": 5,
        "durationFrames": 121,
        "generateAudio": True,
        "globalPrompt": "cinematic scene",
        "promptSegments": [
            {"id": "one", "startFrame": 0, "endFrameExclusive": 61, "prompt": "walk"},
            {"id": "two", "startFrame": 61, "endFrameExclusive": 121, "prompt": "turn"},
        ],
    }
    payload.update(updates)
    return GenerateDirectorRequest.model_validate(payload)


def _policy():
    profile = get_video_profile("ltx2_22b_distilled")
    assert profile is not None
    return profile.director


@pytest.mark.parametrize(
    ("requested", "expected"),
    [(1, 9), (9, 9), (10, 17), (120, 121), (121, 121), (122, 129)],
)
def test_snap_ltx_frames_up(requested: int, expected: int) -> None:
    assert snap_ltx_frames_up(requested) == expected


@pytest.mark.parametrize(("point", "expected"), [("start", 10), ("centre", 14), ("end", 19)])
def test_resolve_keyframe_point(point: str, expected: int) -> None:
    segment = DirectorPromptSegmentInput.model_validate(
        {
            "id": "segment",
            "startFrame": 10,
            "endFrameExclusive": 20,
            "keyframe": {"path": "image.png", "point": point},
        }
    )
    assert resolve_keyframe_frame(segment) == expected


def test_compiles_prompt_relay_and_injected_keyframes() -> None:
    request = _request(
        promptSegments=[
            {
                "id": "one",
                "startFrame": 0,
                "endFrameExclusive": 61,
                "prompt": "walk",
                "keyframe": {"path": "start.png", "point": "start"},
            },
            {
                "id": "two",
                "startFrame": 61,
                "endFrameExclusive": 121,
                "prompt": "turn",
                "keyframe": {"path": "end.png", "point": "end"},
            },
        ]
    )
    plan = compile_director_request(request, _policy())
    assert plan.compiled_prompt == "cinematic scene\n[1:61] walk\n[62:121] turn"
    assert plan.start_image_path is None
    assert plan.end_image_path is None
    assert [frame.frame for frame in plan.injected_frames] == [0, 120]
    assert plan.image_prompt_type is None
    assert plan.video_prompt_type == "KFI"


def test_empty_local_prompt_uses_global_prompt() -> None:
    request = _request(promptSegments=[{"id": "one", "startFrame": 0, "endFrameExclusive": 121, "prompt": ""}])
    assert "[1:121] cinematic scene" in compile_director_request(request, _policy()).compiled_prompt


def test_prompt_gaps_extend_previous_prompt_to_next_segment() -> None:
    request = _request(
        promptSegments=[
            {
                "id": "one",
                "startFrame": 0,
                "endFrameExclusive": 41,
                "prompt": "walk",
                "keyframe": {"path": "gap.png", "point": "end"},
            },
            {"id": "two", "startFrame": 61, "endFrameExclusive": 81, "prompt": "turn"},
        ]
    )
    plan = compile_director_request(request, _policy())
    assert plan.compiled_prompt == "cinematic scene\n[1:61] walk\n[62:121] turn"
    assert plan.injected_frames[0].frame == 40


def test_start_and_end_keyframes_use_visible_injected_positions() -> None:
    request = _request(
        promptSegments=[
            {
                "id": "one",
                "startFrame": 0,
                "endFrameExclusive": 41,
                "prompt": "walk",
                "keyframe": {"path": "start.png", "point": "start"},
            },
            {
                "id": "two",
                "startFrame": 61,
                "endFrameExclusive": 81,
                "prompt": "turn",
                "keyframe": {"path": "end.png", "point": "end"},
            },
        ]
    )
    plan = compile_director_request(request, _policy())
    assert plan.start_image_path is None
    assert plan.end_image_path is None
    assert [frame.frame for frame in plan.injected_frames] == [0, 80]
    assert plan.image_prompt_type is None
    assert plan.video_prompt_type == "KFI"


def test_rejects_manual_prompt_relay() -> None:
    with pytest.raises(DirectorValidationError, match="DIRECTOR_MANUAL_RELAY_NOT_ALLOWED"):
        compile_director_request(_request(globalPrompt="[1:60] hidden timing"), _policy())


def test_profile_policy_blocks_prompt_relay() -> None:
    with pytest.raises(DirectorValidationError, match="DIRECTOR_WANGP_MAPPING_UNAVAILABLE"):
        compile_director_request(_request(), replace(_policy(), prompt_relay=False))


def test_profile_policy_blocks_guide_audio() -> None:
    request = _request(guideAudio={"path": "guide.wav", "trimDuration": 5})
    with pytest.raises(DirectorValidationError, match="DIRECTOR_GUIDANCE_NOT_SUPPORTED"):
        compile_director_request(request, replace(_policy(), guide_audio_start_only=False))


def test_rejects_non_v1_frame_rate() -> None:
    with pytest.raises(DirectorValidationError, match="DIRECTOR_WANGP_MAPPING_UNAVAILABLE"):
        compile_director_request(_request(fps=30), _policy())


@pytest.mark.parametrize(
    ("segments", "code"),
    [
        ([{"id": "one", "startFrame": 0, "endFrameExclusive": 80, "prompt": "x"}, {"id": "two", "startFrame": 70, "endFrameExclusive": 121, "prompt": "y"}], "DIRECTOR_PROMPT_OVERLAP"),
        ([{"id": "one", "startFrame": 0, "endFrameExclusive": 122, "prompt": "x"}], "DIRECTOR_INVALID_FRAME_RANGE"),
    ],
)
def test_rejects_bad_prompt_ranges(segments: list[dict[str, object]], code: str) -> None:
    with pytest.raises(DirectorValidationError, match=code):
        compile_director_request(_request(promptSegments=segments), _policy())


def test_continue_video_uses_generated_prompt_coordinates_and_injected_final_coordinate() -> None:
    request = _request(
        promptSegments=[
            {
                "id": "one",
                "startFrame": 33,
                "endFrameExclusive": 121,
                "prompt": "continue",
                "keyframe": {"path": "injected.png", "point": "centre"},
            }
        ],
        continueVideo={
            "path": "source.mp4",
            "timelineDurationFrames": 33,
            "trimDuration": 1.375,
            "useSourceAudio": False,
        },
    )
    plan = compile_director_request(request, _policy())
    assert plan.compiled_prompt.endswith("[1:88] continue")
    assert plan.image_prompt_type == "V"
    assert plan.video_prompt_type == "KFI"
    assert plan.injected_frames[0].frame == 76


def test_continue_video_final_image_uses_verified_injected_fallback() -> None:
    request = _request(
        promptSegments=[{
            "id": "one",
            "startFrame": 33,
            "endFrameExclusive": 121,
            "prompt": "continue",
            "keyframe": {"path": "final.png", "point": "end"},
        }],
        continueVideo={
            "path": "source.mp4",
            "timelineDurationFrames": 33,
            "trimDuration": 1.375,
        },
    )
    plan = compile_director_request(request, _policy())
    assert plan.end_image_path is None
    assert plan.injected_frames[0].frame == 120
    assert plan.warnings == ()


def test_rejects_continue_duration_mismatch() -> None:
    request = _request(
        promptSegments=[{"id": "one", "startFrame": 33, "endFrameExclusive": 121, "prompt": "continue"}],
        continueVideo={
            "path": "source.mp4",
            "timelineDurationFrames": 33,
            "trimDuration": 2,
        },
    )
    with pytest.raises(DirectorValidationError, match="DIRECTOR_INVALID_FRAME_RANGE"):
        compile_director_request(request, _policy())


def test_adjacent_keyframes_do_not_collide() -> None:
    request = _request(
        promptSegments=[
            {"id": "one", "startFrame": 0, "endFrameExclusive": 1, "prompt": "x", "keyframe": {"path": "a.png", "point": "end"}},
            {"id": "two", "startFrame": 1, "endFrameExclusive": 121, "prompt": "y", "keyframe": {"path": "b.png", "point": "start"}},
        ]
    )
    plan = compile_director_request(request, _policy())
    assert [frame.frame for frame in plan.injected_frames] == [0, 1]
    assert plan.start_image_path is None


def test_rejects_audio_conflict() -> None:
    request = _request(
        continueVideo={"path": "source.mp4", "timelineDurationFrames": 33, "trimDuration": 1.375, "useSourceAudio": True},
        guidance={"mode": "human_motion", "path": "guide.mp4", "useSourceAudio": True},
        promptSegments=[{"id": "one", "startFrame": 33, "endFrameExclusive": 121, "prompt": "x"}],
    )
    with pytest.raises(DirectorValidationError, match="DIRECTOR_AUDIO_SOURCE_CONFLICT"):
        compile_director_request(request, _policy())


def test_continue_source_audio_disables_but_preserves_guide_audio() -> None:
    request = _request(
        continueVideo={"path": "source.mp4", "timelineDurationFrames": 33, "trimDuration": 1.375, "useSourceAudio": True},
        guideAudio={"path": "guide.wav", "trimDuration": 5},
        promptSegments=[{"id": "one", "startFrame": 33, "endFrameExclusive": 121, "prompt": "x"}],
    )
    plan = compile_director_request(request, _policy())
    assert plan.guide_audio_path == "source.mp4"
    assert plan.audio_prompt_type == "K"


@pytest.mark.parametrize(
    ("mode", "video_prompt_type"),
    [("human_motion", "PVG"), ("depth", "DVG"), ("ingredients", "I")],
)
def test_guidance_mapping(mode: str, video_prompt_type: str) -> None:
    guidance: dict[str, object] = {"mode": mode, "path": "guide.png" if mode == "ingredients" else "guide.mp4"}
    if mode == "ingredients":
        guidance["referenceDescription"] = "red coat character sheet"
    plan = compile_director_request(_request(guidance=guidance), _policy())
    assert plan.video_prompt_type == video_prompt_type


def test_requires_ingredients_description() -> None:
    with pytest.raises(DirectorValidationError, match="DIRECTOR_INGREDIENTS_DESCRIPTION_REQUIRED"):
        compile_director_request(
            _request(guidance={"mode": "ingredients", "path": "guide.png"}),
            _policy(),
        )
