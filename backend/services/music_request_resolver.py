"""Pure product-to-ACE Music V2 mappings."""

from __future__ import annotations

import re
from dataclasses import dataclass
from collections.abc import Sequence
from typing import Literal

from api_types import (
    MusicAudioInputRequest,
    MusicAudioRole,
    MusicDurationMode,
    MusicVocalGender,
)

_KEY_SCALE_RE = re.compile(
    r"^([A-Ga-g])\s*([#b♯♭]?)\s*(major|minor|maj|min|m)$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class ResolvedAudioTask:
    prompt_type: Literal["", "A", "B", "AB"]
    source_path: str | None
    reference_path: str | None
    cover_strength: float | None


def resolve_ace_model_mode(
    duration_mode: MusicDurationMode,
    enhance_description: bool,
) -> int:
    if duration_mode is MusicDurationMode.MANUAL:
        return 2 if enhance_description else 1
    return 3 if enhance_description else 4


def resolve_weirdness(value: int) -> float:
    clamped = max(0, min(100, value))
    # ponytail: ACE currently shares this temperature across both LM phases;
    # split it only when the pinned runtime exposes separate controls.
    return round(0.55 + clamped * 0.006, 2)


def resolve_prompt_influence(value: int) -> float:
    clamped = max(0, min(100, value))
    return round(1.0 + clamped / 100.0 * 2.0, 2)


def resolve_vocal_language(
    value: str,
    *,
    instrumental: bool,
    supported_languages: tuple[str, ...],
) -> str | None:
    if instrumental:
        return "unknown"
    normalized = value.strip().casefold()
    if normalized == "auto":
        return None
    if normalized not in supported_languages:
        raise ValueError(f"MUSIC_LANGUAGE_UNSUPPORTED: Unsupported language '{value}'.")
    return normalized


def resolve_vocal_description(
    description: str,
    gender: MusicVocalGender,
    *,
    instrumental: bool,
) -> tuple[str, tuple[str, ...]]:
    modifiers = {
        MusicVocalGender.FEMALE: "female lead vocals",
        MusicVocalGender.MALE: "male lead vocals",
        MusicVocalGender.MIXED: "male and female duet vocals",
    }
    modifier = None if instrumental else modifiers.get(gender)
    if modifier is None or modifier.casefold() in description.casefold():
        return description, ()
    return f"{description.rstrip(' ,')}, {modifier}", (modifier,)


def normalize_music_key_scale(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    match = _KEY_SCALE_RE.fullmatch(value.strip())
    if match is None:
        raise ValueError("MUSIC_KEY_SCALE_INVALID: Use a key such as C major or F# minor.")
    note = match.group(1).upper()
    accidental = match.group(2).replace("♯", "#").replace("♭", "b")
    raw_mode = match.group(3).casefold()
    mode = "major" if raw_mode in {"major", "maj"} else "minor"
    return f"{note}{accidental} {mode}"


def resolve_audio_task(
    audio_inputs: Sequence[MusicAudioInputRequest],
) -> ResolvedAudioTask:
    cover = next(
        (item for item in audio_inputs if item.role is MusicAudioRole.COVER),
        None,
    )
    reference = next(
        (
            item
            for item in audio_inputs
            if item.role is MusicAudioRole.REFERENCE_TIMBRE
        ),
        None,
    )
    prompt_type: Literal["", "A", "B", "AB"] = (
        "AB" if cover and reference else "A" if cover else "B" if reference else ""
    )
    return ResolvedAudioTask(
        prompt_type,
        cover.path if cover else None,
        reference.path if reference else None,
        cover.strength if cover else None,
    )
