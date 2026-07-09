"""Map AiVS Reframe UI padding to WanGP outpainting manifest fields."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ReframeAspectMode = Literal["1:1", "16:9", "9:16", "custom"]


@dataclass(frozen=True)
class ReframePadding:
    top: int
    bottom: int
    left: int
    right: int


@dataclass(frozen=True)
class WanGPOutpaintParams:
    video_guide_outpainting: str
    video_guide_outpainting_ratio: str
    output_aspect_ratio: Literal["16:9", "9:16"]


def _has_padding(padding: ReframePadding) -> bool:
    return padding.top > 0 or padding.bottom > 0 or padding.left > 0 or padding.right > 0


def _format_padding(padding: ReframePadding) -> str:
    return f"{padding.top} {padding.bottom} {padding.left} {padding.right}"


def _derive_custom_output_aspect(
    video_width: int,
    video_height: int,
    padding: ReframePadding,
) -> Literal["16:9", "9:16"]:
    if video_width <= 0 or video_height <= 0:
        return "16:9"
    outer_w = video_width * (1 + padding.left / 100 + padding.right / 100)
    outer_h = video_height * (1 + padding.top / 100 + padding.bottom / 100)
    return "16:9" if outer_w >= outer_h else "9:16"


def map_reframe_to_wangp(
    aspect_mode: ReframeAspectMode,
    padding: ReframePadding,
    *,
    video_width: int = 0,
    video_height: int = 0,
) -> WanGPOutpaintParams:
    """Convert Reframe UI state to WanGP ``video_guide_outpainting*`` fields.

    Custom mode uses percentage units (ratio empty). Preset aspect modes with
    zero padding fit the box only. Preset modes with padding send the same
    integer edge values while ratio stays set — WanGP interprets those as
    multiplier (x) units when ratio is non-empty.
    """
    if aspect_mode == "custom":
        return WanGPOutpaintParams(
            video_guide_outpainting="" if not _has_padding(padding) else _format_padding(padding),
            video_guide_outpainting_ratio="",
            output_aspect_ratio=_derive_custom_output_aspect(video_width, video_height, padding),
        )

    ratio = aspect_mode
    if ratio == "16:9":
        output_aspect: Literal["16:9", "9:16"] = "16:9"
    elif ratio == "9:16":
        output_aspect = "9:16"
    else:
        output_aspect = "16:9" if video_width >= video_height else "9:16"

    if not _has_padding(padding):
        return WanGPOutpaintParams(
            video_guide_outpainting="",
            video_guide_outpainting_ratio=ratio,
            output_aspect_ratio=output_aspect,
        )

    return WanGPOutpaintParams(
        video_guide_outpainting=_format_padding(padding),
        video_guide_outpainting_ratio=ratio,
        output_aspect_ratio=output_aspect,
    )
