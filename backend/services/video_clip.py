"""Extract a subclip from a video file via ffmpeg."""

from __future__ import annotations

import subprocess
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import cast

import imageio_ffmpeg


@dataclass(frozen=True)
class VideoMetadata:
    frame_count: int
    duration_seconds: float


def probe_video_metadata(source_path: str | Path) -> VideoMetadata | None:
    """Return frame/duration metadata when ffmpeg can read the source."""
    try:
        count_frames = cast(
            Callable[[str], tuple[int | None, float | None]],
            getattr(imageio_ffmpeg, "count_frames_and_secs"),
        )
        frame_count, duration_seconds = count_frames(str(Path(source_path).resolve()))
    except Exception:
        return None
    if frame_count is None or duration_seconds is None:
        return None
    if frame_count <= 0 or duration_seconds <= 0:
        return None
    return VideoMetadata(frame_count=int(frame_count), duration_seconds=float(duration_seconds))


def extract_video_clip(
    source_path: str | Path,
    *,
    start_time: float,
    duration: float,
    output_dir: Path,
) -> Path:
    """Return path to a trimmed copy of ``source_path``."""
    if duration <= 0:
        raise ValueError("duration must be positive")
    if start_time < 0:
        raise ValueError("start_time must be non-negative")

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"reframe_clip_{uuid.uuid4().hex[:8]}.mp4"
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg,
        "-y",
        "-ss",
        f"{start_time:.3f}",
        "-i",
        str(Path(source_path).resolve()),
        "-t",
        f"{duration:.3f}",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        raise RuntimeError(f"ffmpeg clip extract failed: {stderr or result.returncode}")
    if not output_path.exists():
        raise RuntimeError("ffmpeg clip extract produced no output file")
    return output_path
