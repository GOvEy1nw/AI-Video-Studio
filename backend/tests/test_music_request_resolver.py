"""Music V2 product-to-ACE mapping tests."""

from __future__ import annotations

import pytest

from api_types import MusicAudioInputRequest, MusicDurationMode, MusicVocalGender
from services.music_request_resolver import (
    normalize_music_key_scale,
    resolve_ace_model_mode,
    resolve_audio_task,
    resolve_prompt_influence,
    resolve_vocal_description,
    resolve_vocal_language,
    resolve_weirdness,
)


@pytest.mark.parametrize(
    ("duration_mode", "enhance", "expected"),
    [
        (MusicDurationMode.MANUAL, False, 1),
        (MusicDurationMode.MANUAL, True, 2),
        (MusicDurationMode.AUTO, False, 4),
        (MusicDurationMode.AUTO, True, 3),
    ],
)
def test_resolve_ace_model_mode(
    duration_mode: MusicDurationMode, enhance: bool, expected: int
) -> None:
    assert resolve_ace_model_mode(duration_mode, enhance) == expected


@pytest.mark.parametrize(
    ("value", "expected"),
    [(-1, 0.55), (0, 0.55), (25, 0.7), (50, 0.85), (75, 1.0), (100, 1.15), (101, 1.15)],
)
def test_resolve_weirdness(value: int, expected: float) -> None:
    assert resolve_weirdness(value) == expected


@pytest.mark.parametrize(
    ("value", "expected"),
    [(-1, 1.0), (0, 1.0), (50, 2.0), (75, 2.5), (100, 3.0), (101, 3.0)],
)
def test_resolve_prompt_influence(value: int, expected: float) -> None:
    assert resolve_prompt_influence(value) == expected


def test_vocal_description_conditioning_is_normalized_and_non_destructive() -> None:
    source = "Cinematic pop"
    conditioned, modifiers = resolve_vocal_description(
        source, MusicVocalGender.MIXED, instrumental=False
    )
    assert source == "Cinematic pop"
    assert conditioned == "Cinematic pop, male and female duet vocals"
    assert modifiers == ("male and female duet vocals",)
    assert resolve_vocal_description(
        conditioned, MusicVocalGender.MIXED, instrumental=False
    ) == (conditioned, ())
    assert resolve_vocal_description(
        source, MusicVocalGender.FEMALE, instrumental=True
    ) == (source, ())


def test_language_resolution() -> None:
    supported = ("en", "fr", "unknown")
    assert resolve_vocal_language(
        "en", instrumental=False, supported_languages=supported
    ) == "en"
    assert resolve_vocal_language(
        "auto", instrumental=False, supported_languages=supported
    ) is None
    assert resolve_vocal_language(
        "en", instrumental=True, supported_languages=supported
    ) == "unknown"
    with pytest.raises(ValueError, match="MUSIC_LANGUAGE_UNSUPPORTED"):
        resolve_vocal_language("xx", instrumental=False, supported_languages=supported)


def test_audio_task_resolution() -> None:
    assert resolve_audio_task([]).prompt_type == ""
    cover = resolve_audio_task(
        [MusicAudioInputRequest(path="song.wav", role="cover", strength=0.7)]
    )
    assert (cover.prompt_type, cover.source_path, cover.cover_strength) == (
        "A",
        "song.wav",
        0.7,
    )
    reference = resolve_audio_task(
        [MusicAudioInputRequest(path="voice.wav", role="reference-timbre")]
    )
    assert (reference.prompt_type, reference.reference_path) == ("B", "voice.wav")
    combined = resolve_audio_task(
        [
            MusicAudioInputRequest(path="song.wav", role="cover", strength=0.7),
            MusicAudioInputRequest(path="voice.wav", role="reference-timbre"),
        ]
    )
    assert (
        combined.prompt_type,
        combined.source_path,
        combined.reference_path,
        combined.cover_strength,
    ) == ("AB", "song.wav", "voice.wav", 0.7)


@pytest.mark.parametrize(
    ("value", "expected"),
    [("Am", "A minor"), ("F# major", "F# major"), ("E♭ min", "Eb minor"), (None, None)],
)
def test_normalize_music_key_scale(value: str | None, expected: str | None) -> None:
    assert normalize_music_key_scale(value) == expected
