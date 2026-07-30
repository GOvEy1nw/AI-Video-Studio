"""Create temporary cropped media derivatives without changing source files."""

from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path
from typing import Protocol

import imageio_ffmpeg
from PIL import Image, ImageOps


class MediaCropLike(Protocol):
    x: float
    y: float
    width: float
    height: float


def _temporary_path(suffix: str) -> Path:
    descriptor, raw_path = tempfile.mkstemp(prefix="aivs_crop_", suffix=suffix)
    os.close(descriptor)
    return Path(raw_path)


def crop_image_media(source_path: str | Path, crop: MediaCropLike) -> Path:
    """Return a temporary PNG containing the requested normalized image crop."""
    output_path = _temporary_path(".png")
    try:
        with Image.open(Path(source_path).resolve()) as source:
            oriented = ImageOps.exif_transpose(source)
            width, height = oriented.size
            left = max(0, min(width - 1, round(width * crop.x)))
            top = max(0, min(height - 1, round(height * crop.y)))
            right = max(left + 1, min(width, round(width * (crop.x + crop.width))))
            bottom = max(top + 1, min(height, round(height * (crop.y + crop.height))))
            cropped = oriented.crop((left, top, right, bottom))
            if cropped.mode not in {"RGB", "RGBA", "L", "LA"}:
                cropped = cropped.convert("RGBA" if "transparency" in source.info else "RGB")
            cropped.save(output_path, format="PNG")
    except Exception:
        output_path.unlink(missing_ok=True)
        raise
    return output_path


def crop_video_media(source_path: str | Path, crop: MediaCropLike) -> Path:
    """Return a temporary MP4 with cropped video and optional source audio."""
    output_path = _temporary_path(".mp4")
    width = f"{crop.width:.8f}"
    height = f"{crop.height:.8f}"
    x = f"{crop.x:.8f}"
    y = f"{crop.y:.8f}"
    crop_filter = (
        f"crop=max(2\\,trunc(iw*{width}/2)*2):"
        f"max(2\\,trunc(ih*{height}/2)*2):"
        f"trunc(iw*{x}/2)*2:"
        f"trunc(ih*{y}/2)*2"
    )
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(),
        "-y",
        "-i",
        str(Path(source_path).resolve()),
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-vf",
        crop_filter,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(output_path),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        output_path.unlink(missing_ok=True)
        stderr = (result.stderr or "").strip()
        raise RuntimeError(f"ffmpeg media crop failed: {stderr or result.returncode}")
    if not output_path.exists() or output_path.stat().st_size == 0:
        output_path.unlink(missing_ok=True)
        raise RuntimeError("ffmpeg media crop produced no output file")
    return output_path
