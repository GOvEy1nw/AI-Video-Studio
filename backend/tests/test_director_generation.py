from __future__ import annotations


def _payload() -> dict[str, object]:
    return {
        "schemaVersion": 1,
        "modelProfileId": "ltx2_22b_distilled",
        "resolutionTier": "540p",
        "aspectRatio": "16:9",
        "fps": 24,
        "requestedDurationSeconds": 5,
        "durationFrames": 121,
        "generateAudio": True,
        "globalPrompt": "cinematic scene",
        "promptSegments": [
            {"id": "one", "startFrame": 0, "endFrameExclusive": 121, "prompt": "walk"}
        ],
    }


def test_director_generation_uses_shared_state_and_bridge(client, enable_wangp) -> None:
    response = client.post("/api/director/generate", json=_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "complete"
    assert body["resolvedFrameCount"] == 121
    assert body["compiledPrompt"] == "cinematic scene\n[1:121] walk"
    settings = enable_wangp.director_calls[0].settings
    assert settings["model_type"] == "ltx2_22B_distilled_1_1"
    assert settings["multi_prompts_gen_type"] == "FG"
    assert settings["video_length"] == 121
    assert "activated_loras" not in settings


def test_director_rejects_unknown_profile(client, enable_wangp) -> None:
    payload = _payload()
    payload["modelProfileId"] = "missing"
    response = client.post("/api/director/generate", json=payload)
    assert response.status_code == 400
    assert response.json()["error"] == "DIRECTOR_PROFILE_NOT_SUPPORTED"


def test_director_rejects_unavailable_model(client, enable_wangp) -> None:
    enable_wangp.available = False
    response = client.post("/api/director/generate", json=_payload())
    assert response.status_code == 503
    assert response.json()["error"] == "DIRECTOR_MODEL_UNAVAILABLE"


def test_director_rejects_uncurated_resolution(client, enable_wangp) -> None:
    payload = _payload()
    payload["resolutionTier"] = "2160p"
    response = client.post("/api/director/generate", json=payload)
    assert response.status_code == 400
    assert response.json()["error"].startswith("DIRECTOR_WANGP_MAPPING_UNAVAILABLE:")


def test_director_rejects_concurrent_generation(client, enable_wangp, test_state) -> None:
    test_state.generation.start_generation_job("existing")
    response = client.post("/api/director/generate", json=_payload())
    assert response.status_code == 409


def test_director_reports_missing_keyframe_asset(client, enable_wangp, tmp_path) -> None:
    payload = _payload()
    segments = payload["promptSegments"]
    assert isinstance(segments, list)
    segments[0]["keyframe"] = {
        "path": str(tmp_path / "missing.png"),
        "point": "start",
    }

    response = client.post("/api/director/generate", json=payload)

    assert response.status_code == 400
    assert response.json()["error"].startswith("DIRECTOR_MISSING_ASSET:")


def test_director_reports_invalid_keyframe_media(client, enable_wangp, tmp_path) -> None:
    invalid = tmp_path / "invalid.png"
    invalid.write_bytes(b"not-an-image")
    payload = _payload()
    segments = payload["promptSegments"]
    assert isinstance(segments, list)
    segments[0]["keyframe"] = {"path": str(invalid), "point": "start"}

    response = client.post("/api/director/generate", json=payload)

    assert response.status_code == 400
    assert response.json()["error"].startswith("DIRECTOR_MEDIA_TYPE_MISMATCH:")


def test_director_reports_missing_continue_video(client, enable_wangp, tmp_path) -> None:
    payload = _payload()
    payload["continueVideo"] = {
        "path": str(tmp_path / "missing.mp4"),
        "timelineDurationFrames": 33,
        "trimDuration": 1,
    }
    payload["promptSegments"] = [
        {"id": "one", "startFrame": 33, "endFrameExclusive": 121, "prompt": "walk"}
    ]

    response = client.post("/api/director/generate", json=payload)

    assert response.status_code == 400
    assert response.json()["error"].startswith("DIRECTOR_MISSING_ASSET:")


def test_director_reports_missing_guide_audio(client, enable_wangp, tmp_path) -> None:
    payload = _payload()
    payload["guideAudio"] = {
        "path": str(tmp_path / "missing.wav"),
        "trimDuration": 5,
    }

    response = client.post("/api/director/generate", json=payload)

    assert response.status_code == 400
    assert response.json()["error"].startswith("DIRECTOR_MISSING_ASSET:")


def test_director_bridge_error_propagates(client, enable_wangp) -> None:
    enable_wangp.raise_on_director = RuntimeError("director bridge failed")
    response = client.post("/api/director/generate", json=_payload())
    assert response.status_code == 500
    assert "director bridge failed" in response.json()["error"]
