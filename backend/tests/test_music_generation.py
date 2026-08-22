"""Quick Music endpoint integration tests."""

from __future__ import annotations

import wave
from dataclasses import replace
from pathlib import Path

from api_types import GenerateMusicRequest
from handlers import music_generation_handler
from model_profiles import get_music_profile


def _request(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "schemaVersion": 2,
        "modelProfileId": "ace_step_15_turbo",
        "description": "Warm cinematic ambient music",
        "vocalMode": "instrumental",
        "durationMode": "auto",
        "durationSeconds": 60,
        "vocalLanguage": "en",
        "vocalGender": "auto",
        "enhanceDescription": False,
        "weirdness": 50,
        "promptInfluence": 75,
        "variations": 1,
    }
    payload.update(overrides)
    return payload


def test_instrumental_generation_maps_product_values(client, enable_wangp) -> None:
    response = client.post(
        "/api/generate-music",
        json=_request(
            bpm=96,
            timeSignature="4/4",
            keyScale="Am",
        ),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["resolvedLyrics"] is None
    assert len(payload["outputs"]) == 1
    assert payload["outputs"][0]["format"] == "wav"
    call = enable_wangp.music_calls[0]
    assert call.lyrics == "[Instrumental]"
    assert call.key_scale == "A minor"
    assert call.bpm == 96
    assert call.time_signature == "4/4"
    assert call.model_type == "ace_step_v1_5_turbo_lm_1_7b"
    assert call.model_mode == 4
    assert call.temperature == 0.85
    assert call.lm_guidance_scale == 2.5
    assert call.default_settings["prompt_enhancer"] == ""


def test_curated_preset_profile_reaches_music_generation(
    test_state, enable_wangp, monkeypatch
) -> None:
    profile = get_music_profile("ace_step_15_turbo")
    assert profile is not None
    patched_profile = replace(profile, wangp_preset_profile_id="test_music_preset")
    monkeypatch.setattr(
        music_generation_handler,
        "get_music_profile",
        lambda profile_id: patched_profile if profile_id == patched_profile.id else None,
    )

    response = test_state.music_generation.generate(
        GenerateMusicRequest.model_validate(_request())
    )

    assert response.status == "success"
    assert enable_wangp.resolved_profile_calls == [
        (patched_profile.wangp_model_type, None, "test_music_preset")
    ]
    assert (
        enable_wangp.music_calls[0].default_settings["resolved_preset_profile_id"]
        == "test_music_preset"
    )


def test_custom_lyrics_are_normalized_and_returned(client, enable_wangp) -> None:
    response = client.post(
        "/api/generate-music",
        json=_request(vocalMode="custom-lyrics", lyrics="  [Verse]\nHello  "),
    )
    assert response.status_code == 200
    assert response.json()["resolvedLyrics"] == "[Verse]\nHello"
    assert enable_wangp.music_calls[0].lyrics == "[Verse]\nHello"
    assert enable_wangp.music_calls[0].default_settings["prompt_enhancer"] == ""


def test_auto_lyrics_are_composed_by_wangp_during_generation(client, enable_wangp) -> None:
    response = client.post(
        "/api/generate-music",
        json=_request(vocalMode="auto-lyrics"),
    )
    assert response.status_code == 200
    assert response.json()["resolvedLyrics"] is None
    assert enable_wangp.compose_music_lyrics_calls == []
    call = enable_wangp.music_calls[0]
    assert call.lyrics == "Warm cinematic ambient music"
    assert call.default_settings["prompt_enhancer"] == "T"


def test_minimax_music3_maps_verified_defaults_and_prompt_enhancers(
    client, enable_wangp
) -> None:
    response = client.post(
        "/api/generate-music",
        json=_request(
            modelProfileId="minimax_music3",
            vocalMode="custom-lyrics",
            lyrics="[Verse]\nHello",
            durationMode="manual",
            durationSeconds=300,
            vocalLanguage="auto",
            enhanceDescription=False,
        ),
    )
    assert response.status_code == 200
    call = enable_wangp.music_calls[0]
    assert call.model_type == "minimax_music3"
    assert call.description == "Warm cinematic ambient music"
    assert call.lyrics == "[Verse]\nHello"
    assert call.duration_seconds == 300
    assert call.default_settings["num_inference_steps"] == 30
    assert call.default_settings["guidance_scale"] == 1.7
    assert call.default_settings["prompt_enhancer"] == ""

    response = client.post(
        "/api/generate-music",
        json=_request(
            modelProfileId="minimax_music3",
            vocalMode="auto-lyrics",
            vocalLanguage="auto",
            enhanceDescription=True,
        ),
    )
    assert response.status_code == 200
    assert enable_wangp.music_calls[1].default_settings["prompt_enhancer"] == "T1,B2O"

    response = client.post(
        "/api/generate-music",
        json=_request(
            modelProfileId="minimax_music3",
            vocalMode="auto-lyrics",
            vocalLanguage="auto",
            enhanceDescription=False,
        ),
    )
    assert response.status_code == 200
    assert enable_wangp.music_calls[2].default_settings["prompt_enhancer"] == "T1"

    response = client.post(
        "/api/generate-music",
        json=_request(
            modelProfileId="minimax_music3",
            vocalMode="custom-lyrics",
            lyrics="[Verse]\nHello",
            vocalLanguage="auto",
            enhanceDescription=True,
        ),
    )
    assert response.status_code == 200
    assert enable_wangp.music_calls[3].default_settings["prompt_enhancer"] == "B2O"


def test_empty_custom_lyrics_are_rejected_before_generation(
    client, enable_wangp
) -> None:
    response = client.post(
        "/api/generate-music",
        json=_request(
            vocalMode="custom-lyrics",
            lyricsPrompt="A reunion at sunrise",
            lyricsThink=True,
            lyricsSeed=123,
        ),
    )
    assert response.status_code == 400
    assert response.json()["error"].startswith("MUSIC_CUSTOM_LYRICS_REQUIRED")
    assert enable_wangp.compose_music_lyrics_calls == []
    assert enable_wangp.music_calls == []


def test_compose_lyrics_is_a_separate_local_operation(client, enable_wangp) -> None:
    response = client.post(
        "/api/music/compose-lyrics",
        json={
            "modelProfileId": "ace_step_15_turbo",
            "description": "Dreamy electronic pop",
            "lyricsPrompt": "A reunion at sunrise",
            "vocalLanguage": "fr",
            "durationMode": "auto",
            "durationSeconds": 60,
            "think": True,
            "seed": 456,
        },
    )
    assert response.status_code == 200
    assert response.json() == {
        "status": "success",
        "lyrics": "[Verse]\nLocally composed lyrics",
        "usedThinking": True,
        "warnings": [],
    }
    call = enable_wangp.compose_music_lyrics_calls[0]
    assert call.lyrics_prompt == "A reunion at sunrise"
    assert call.language == "fr"
    assert call.think is True
    assert call.seed == 456
    assert enable_wangp.music_calls == []


def test_model_mode_truth_table_and_effective_settings(client, enable_wangp) -> None:
    cases = [
        ("manual", False, 1),
        ("manual", True, 2),
        ("auto", False, 4),
        ("auto", True, 3),
    ]
    for duration_mode, enhance, expected in cases:
        response = client.post(
            "/api/generate-music",
            json=_request(durationMode=duration_mode, enhanceDescription=enhance),
        )
        assert response.status_code == 200
        assert response.json()["effectiveSettings"]["modelMode"] == expected
        assert enable_wangp.music_calls[-1].model_mode == expected


def test_language_gender_and_creative_controls_reach_bridge(client, enable_wangp) -> None:
    response = client.post(
        "/api/generate-music",
        json=_request(
            vocalMode="custom-lyrics",
            lyrics="[Verse]\nBonjour",
            vocalLanguage="fr",
            vocalGender="female",
            weirdness=100,
            promptInfluence=0,
        ),
    )
    assert response.status_code == 200
    call = enable_wangp.music_calls[0]
    assert call.language == "fr"
    assert call.description.endswith("female lead vocals")
    assert call.temperature == 1.15
    assert call.top_p == 0.9
    assert call.top_k == 0
    assert call.lm_guidance_scale == 1.0


def _write_audio(path: Path, seconds: int = 6) -> Path:
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(8_000)
        output.writeframes(b"\x00\x00" * 8_000 * seconds)
    return path


def test_cover_uses_source_duration_and_custom_lyrics(
    client, enable_wangp, tmp_path: Path
) -> None:
    source = _write_audio(tmp_path / "cover.wav")
    response = client.post(
        "/api/generate-music",
        json=_request(
            vocalMode="custom-lyrics",
            lyrics="[Verse]\nOriginal lyrics",
            durationSeconds=60,
            audioInput={"path": str(source), "role": "cover", "strength": 0.7},
        ),
    )
    assert response.status_code == 200
    call = enable_wangp.music_calls[0]
    assert call.audio_prompt_type == "A"
    assert call.source_audio_path == str(source.resolve())
    assert call.cover_strength == 0.7
    assert call.duration_seconds == 6
    assert response.json()["effectiveSettings"]["effectiveDurationSeconds"] == 6


def test_reference_timbre_uses_ordinary_duration(
    client, enable_wangp, tmp_path: Path
) -> None:
    source = _write_audio(tmp_path / "reference.wav")
    response = client.post(
        "/api/generate-music",
        json=_request(
            vocalMode="auto-lyrics",
            durationMode="manual",
            durationSeconds=30,
            audioInput={"path": str(source), "role": "reference-timbre"},
        ),
    )
    assert response.status_code == 200
    call = enable_wangp.music_calls[0]
    assert call.audio_prompt_type == "B"
    assert call.reference_timbre_path == str(source.resolve())
    assert call.duration_seconds == 30


def test_cover_and_reference_timbre_use_combined_audio_task(
    client, enable_wangp, tmp_path: Path
) -> None:
    cover = _write_audio(tmp_path / "cover.wav")
    reference = _write_audio(tmp_path / "reference.wav")
    response = client.post(
        "/api/generate-music",
        json=_request(
            vocalMode="custom-lyrics",
            lyrics="[Verse]\nOriginal lyrics",
            audioInputs=[
                {"path": str(cover), "role": "cover", "strength": 0.6},
                {"path": str(reference), "role": "reference-timbre"},
            ],
        ),
    )
    assert response.status_code == 200
    call = enable_wangp.music_calls[0]
    assert call.audio_prompt_type == "AB"
    assert call.source_audio_path == str(cover.resolve())
    assert call.reference_timbre_path == str(reference.resolve())
    assert call.cover_strength == 0.6


def test_cover_validation_is_actionable(client, enable_wangp, tmp_path: Path) -> None:
    source = _write_audio(tmp_path / "cover.wav")
    assert client.post(
        "/api/generate-music",
        json=_request(
            vocalMode="auto-lyrics",
            audioInput={"path": str(source), "role": "cover", "strength": 0.5},
        ),
    ).status_code == 422
    response = client.post(
        "/api/generate-music",
        json=_request(
            vocalMode="instrumental",
            audioInput={"path": str(tmp_path / "missing.wav"), "role": "cover"},
        ),
    )
    assert response.status_code == 400
    assert response.json()["error"].startswith("MUSIC_AUDIO_FILE_NOT_FOUND")


def test_variations_are_sequential_with_locked_seed_offsets(
    client, enable_wangp, test_state
) -> None:
    test_state.state.app_settings.seed_locked = True
    test_state.state.app_settings.locked_seed = 42
    response = client.post("/api/generate-music", json=_request(variations=3))
    assert response.status_code == 200
    assert [call.seed for call in enable_wangp.music_calls] == [42, 43, 44]
    assert [item["variationIndex"] for item in response.json()["outputs"]] == [0, 1, 2]


def test_request_validation_rejects_invalid_music_payloads(client, enable_wangp) -> None:
    assert client.post("/api/generate-music", json=_request(description=" ")).status_code == 422
    response = client.post("/api/generate-music", json=_request(durationSeconds=361))
    assert response.status_code == 400
    assert response.json()["error"].startswith("MUSIC_DURATION_OUT_OF_RANGE")
    response = client.post("/api/generate-music", json=_request(keyScale="fast and loud"))
    assert response.status_code == 400
    assert response.json()["error"].startswith("MUSIC_KEY_SCALE_INVALID")


def test_auto_lyrics_does_not_depend_on_local_compose_operation(client, enable_wangp) -> None:
    enable_wangp.raise_on_compose_music_lyrics = RuntimeError("missing enhancer")
    response = client.post(
        "/api/generate-music",
        json=_request(vocalMode="auto-lyrics"),
    )
    assert response.status_code == 200
    assert enable_wangp.compose_music_lyrics_calls == []
    assert enable_wangp.music_calls[0].default_settings["prompt_enhancer"] == "T"


def test_v1_request_remains_compatible(client, enable_wangp) -> None:
    response = client.post(
        "/api/generate-music",
        json={
            "modelProfileId": "ace_step_15_turbo",
            "description": "Legacy request",
            "vocalMode": "instrumental",
            "durationSeconds": 30,
            "autoFillMetadata": True,
            "variations": 1,
        },
    )
    assert response.status_code == 200
    assert enable_wangp.music_calls[0].model_mode == 1
