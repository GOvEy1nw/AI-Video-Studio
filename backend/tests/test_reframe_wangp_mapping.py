from __future__ import annotations

from services.reframe_wangp_mapping import ReframePadding, map_reframe_to_wangp


def test_map_preset_ratio_without_padding() -> None:
    result = map_reframe_to_wangp(
        "1:1",
        ReframePadding(top=0, bottom=0, left=0, right=0),
        video_width=1920,
        video_height=1080,
    )
    assert result.video_guide_outpainting == ""
    assert result.video_guide_outpainting_ratio == "1:1"


def test_map_custom_padding() -> None:
    result = map_reframe_to_wangp(
        "custom",
        ReframePadding(top=35, bottom=70, left=40, right=30),
    )
    assert result.video_guide_outpainting == "35 70 40 30"
    assert result.video_guide_outpainting_ratio == ""


def test_map_custom_output_aspect_prefers_landscape() -> None:
    result = map_reframe_to_wangp(
        "custom",
        ReframePadding(top=10, bottom=10, left=50, right=50),
        video_width=1280,
        video_height=720,
    )
    assert result.output_aspect_ratio == "16:9"
