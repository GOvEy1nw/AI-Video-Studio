"""Quick Music endpoint integration tests."""

from __future__ import annotations


def _request(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "modelProfileId": "ace_step_15_turbo",
        "description": "Warm cinematic ambient music",
        "vocalMode": "instrumental",
        "durationSeconds": 30,
        "autoFillMetadata": True,
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


def test_custom_lyrics_are_normalized_and_returned(client, enable_wangp) -> None:
    response = client.post(
        "/api/generate-music",
        json=_request(vocalMode="custom-lyrics", lyrics="  [Verse]\nHello  "),
    )
    assert response.status_code == 200
    assert response.json()["resolvedLyrics"] == "[Verse]\nHello"
    assert enable_wangp.music_calls[0].lyrics == "[Verse]\nHello"


def test_auto_lyrics_are_composed_locally(client, enable_wangp) -> None:
    response = client.post(
        "/api/generate-music",
        json=_request(vocalMode="auto-lyrics"),
    )
    assert response.status_code == 200
    assert response.json()["resolvedLyrics"].startswith("[Verse]")
    assert len(enable_wangp.compose_music_lyrics_calls) == 1


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
    assert client.post(
        "/api/generate-music",
        json=_request(vocalMode="custom-lyrics"),
    ).status_code == 422
    response = client.post("/api/generate-music", json=_request(durationSeconds=361))
    assert response.status_code == 400
    assert response.json()["error"].startswith("MUSIC_DURATION_OUT_OF_RANGE")
    response = client.post("/api/generate-music", json=_request(keyScale="fast and loud"))
    assert response.status_code == 400
    assert response.json()["error"].startswith("MUSIC_KEY_SCALE_INVALID")


def test_auto_lyrics_dependency_error_is_actionable(client, enable_wangp) -> None:
    enable_wangp.raise_on_compose_music_lyrics = RuntimeError("missing enhancer")
    response = client.post(
        "/api/generate-music",
        json=_request(vocalMode="auto-lyrics"),
    )
    assert response.status_code == 503
    assert response.json()["error"].startswith("AUTO_LYRICS_UNAVAILABLE")
    progress = client.get("/api/generation/progress")
    assert progress.status_code == 200
    assert progress.json()["status"] == "error"
