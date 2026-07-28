"""Generated audio metadata probe tests."""

from __future__ import annotations

import wave
from pathlib import Path

from services.audio_metadata import probe_audio_metadata


def _write_wav(path: Path, *, channels: int, frames: int = 8_000) -> None:
    with wave.open(str(path), "wb") as output:
        output.setnchannels(channels)
        output.setsampwidth(2)
        output.setframerate(8_000)
        output.writeframes(b"\x00\x00" * channels * frames)


def test_probe_mono_wav(tmp_path: Path) -> None:
    path = tmp_path / "mono.wav"
    _write_wav(path, channels=1)
    metadata = probe_audio_metadata(path)
    assert metadata.duration_seconds == 1.0
    assert metadata.sample_rate == 8_000
    assert metadata.channels == 1
    assert metadata.format == "wav"


def test_probe_stereo_wav(tmp_path: Path) -> None:
    path = tmp_path / "stereo.wav"
    _write_wav(path, channels=2, frames=4_000)
    metadata = probe_audio_metadata(path)
    assert metadata.duration_seconds == 0.5
    assert metadata.channels == 2


def test_probe_invalid_or_missing_file_is_safe(tmp_path: Path) -> None:
    invalid = tmp_path / "invalid.wav"
    invalid.write_text("not audio", encoding="utf-8")
    assert probe_audio_metadata(invalid).duration_seconds is None
    assert probe_audio_metadata(tmp_path / "missing.wav").duration_seconds is None
