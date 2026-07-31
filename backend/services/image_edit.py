"""Materialize native masked image-edit guide and mask files."""

from __future__ import annotations

import os
import tempfile
from math import sqrt
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

from api_types import ImageEditMaskRecipe, ImageEditOutpaintRecipe


def _temporary_png(prefix: str) -> Path:
    descriptor, raw_path = tempfile.mkstemp(prefix=prefix, suffix=".png")
    os.close(descriptor)
    return Path(raw_path)


def _fit_resolution_budget_to_source(
    width: int,
    height: int,
    source_width: int,
    source_height: int,
    block_size: int = 16,
) -> tuple[int, int]:
    target_area = width * height
    target_ratio = source_width / source_height
    ideal_width = sqrt(target_area * target_ratio)
    ideal_height = sqrt(target_area / target_ratio)
    width_blocks = max(1, round(ideal_width / block_size))
    height_blocks = max(1, round(ideal_height / block_size))
    candidates = (
        (candidate_width * block_size, candidate_height * block_size)
        for candidate_width in range(max(1, width_blocks - 4), width_blocks + 5)
        for candidate_height in range(
            max(1, height_blocks - 4),
            height_blocks + 5,
        )
    )
    return min(
        candidates,
        key=lambda size: (
            abs(size[0] / size[1] - target_ratio) / target_ratio
            + 0.1 * abs(size[0] * size[1] - target_area) / target_area
        ),
    )


def _inner_box(
    width: int,
    height: int,
    outpaint: ImageEditOutpaintRecipe | None,
) -> tuple[int, int, int, int]:
    if outpaint is None:
        return (0, 0, width, height)
    padding = outpaint.padding
    horizontal_scale = 1 + (padding.left + padding.right) / 100
    vertical_scale = 1 + (padding.top + padding.bottom) / 100
    inner_width = max(1, round(width / horizontal_scale))
    inner_height = max(1, round(height / vertical_scale))
    left = round(inner_width * padding.left / 100)
    top = round(inner_height * padding.top / 100)
    right = min(width, left + inner_width)
    bottom = min(height, top + inner_height)
    return (left, top, right, bottom)


def _draw_mask(
    mask: Image.Image,
    recipe: ImageEditMaskRecipe | None,
    inner: tuple[int, int, int, int],
) -> None:
    if recipe is None:
        return
    draw = ImageDraw.Draw(mask)
    left, top, right, bottom = inner
    width = max(1, right - left)
    height = max(1, bottom - top)

    def point(x: float, y: float) -> tuple[int, int]:
        return (left + round(x * width), top + round(y * height))

    for operation in recipe.operations:
        if operation.kind == "brush":
            points = [point(item.x, item.y) for item in operation.points]
            brush_width = max(1, round(operation.size * min(width, height)))
            if len(points) > 1:
                draw.line(points, fill=255, width=brush_width, joint="curve")
            radius = brush_width / 2
            for x, y in points:
                draw.ellipse(
                    (x - radius, y - radius, x + radius, y + radius),
                    fill=255,
                )
            continue
        x1, y1 = point(operation.x, operation.y)
        x2, y2 = point(
            operation.x + operation.width,
            operation.y + operation.height,
        )
        if operation.kind == "rectangle":
            draw.rectangle((x1, y1, x2, y2), fill=255)
        else:
            draw.ellipse((x1, y1, x2, y2), fill=255)


def materialize_image_edit(
    source_path: str | Path,
    *,
    width: int,
    height: int,
    mask_recipe: ImageEditMaskRecipe | None,
    outpaint: ImageEditOutpaintRecipe | None,
) -> tuple[Path, Path]:
    """Return temporary guide/mask PNGs aligned to output resolution."""
    guide_path = _temporary_png("aivs_edit_guide_")
    mask_path = _temporary_png("aivs_edit_mask_")
    try:
        with Image.open(Path(source_path).resolve()) as source:
            source_image = ImageOps.exif_transpose(source).convert("RGB")
            if outpaint is None:
                width, height = _fit_resolution_budget_to_source(
                    width,
                    height,
                    source_image.width,
                    source_image.height,
                )
            elif outpaint.aspectMode == "custom":
                horizontal_scale = (
                    1
                    + (outpaint.padding.left + outpaint.padding.right) / 100
                )
                vertical_scale = (
                    1
                    + (outpaint.padding.top + outpaint.padding.bottom) / 100
                )
                width, height = _fit_resolution_budget_to_source(
                    width,
                    height,
                    round(source_image.width * horizontal_scale),
                    round(source_image.height * vertical_scale),
                )
            inner = _inner_box(width, height, outpaint)
            left, top, right, bottom = inner
            resized = source_image.resize(
                (max(1, right - left), max(1, bottom - top)),
                Image.Resampling.LANCZOS,
            )
            guide = Image.new("RGB", (width, height), (127, 127, 127))
            guide.paste(resized, (left, top))

        edit_mask = Image.new("L", (width, height), 255 if outpaint else 0)
        if outpaint:
            ImageDraw.Draw(edit_mask).rectangle(inner, fill=0)
        _draw_mask(edit_mask, mask_recipe, inner)
        guide.save(guide_path, format="PNG")
        edit_mask.save(mask_path, format="PNG")
    except Exception:
        guide_path.unlink(missing_ok=True)
        mask_path.unlink(missing_ok=True)
        raise
    return guide_path, mask_path
