"""Lightweight generated-audio metadata probing."""

from __future__ import annotations

import logging
import json
import shutil
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import cast

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class AudioMetadata:
    duration_seconds: float | None = None
    sample_rate: int | None = None
    channels: int | None = None
    format: str | None = None


def probe_audio_metadata(path: str | Path) -> AudioMetadata:
    audio_path = Path(path)
    try:
        if audio_path.suffix.casefold() == ".wav":
            with wave.open(str(audio_path), "rb") as wave_file:
                sample_rate = wave_file.getframerate()
                frames = wave_file.getnframes()
                return AudioMetadata(
                    duration_seconds=frames / sample_rate if sample_rate else None,
                    sample_rate=sample_rate or None,
                    channels=wave_file.getnchannels() or None,
                    format="wav",
                )

        ffprobe = shutil.which("ffprobe")
        if ffprobe is None:
            raise RuntimeError("ffprobe is unavailable")
        result = subprocess.run(
            [
                ffprobe,
                "-v",
                "error",
                "-select_streams",
                "a:0",
                "-show_entries",
                "stream=sample_rate,channels,duration:format=format_name,duration",
                "-of",
                "json",
                str(audio_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        raw: object = json.loads(result.stdout)
        if not isinstance(raw, dict):
            raise ValueError("ffprobe returned an invalid response")
        payload = cast(dict[str, object], raw)
        raw_streams = payload.get("streams")
        audio_stream: dict[str, object] = {}
        if isinstance(raw_streams, list) and raw_streams and isinstance(raw_streams[0], dict):
            audio_stream = cast(dict[str, object], raw_streams[0])
        raw_format = payload.get("format")
        format_info = cast(dict[str, object], raw_format) if isinstance(raw_format, dict) else {}

        def optional_int(value: object) -> int | None:
            if isinstance(value, bool):
                return None
            if isinstance(value, int):
                return value
            if isinstance(value, float):
                return int(value) if value.is_integer() else None
            if isinstance(value, str):
                try:
                    return int(value)
                except ValueError:
                    return None
            return None

        def optional_float(value: object) -> float | None:
            if isinstance(value, bool):
                return None
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                try:
                    return float(value)
                except ValueError:
                    return None
            return None

        duration = optional_float(audio_stream.get("duration"))
        if duration is None:
            duration = optional_float(format_info.get("duration"))
        raw_format_name = format_info.get("format_name")
        return AudioMetadata(
            duration_seconds=duration,
            sample_rate=optional_int(audio_stream.get("sample_rate")),
            channels=optional_int(audio_stream.get("channels")),
            format=(
                str(raw_format_name).split(",", maxsplit=1)[0]
                if raw_format_name is not None
                else audio_path.suffix.lstrip(".").casefold() or None
            ),
        )
    except Exception as exc:
        logger.warning("Could not probe generated audio %s: %s", audio_path, exc)
        return AudioMetadata()
