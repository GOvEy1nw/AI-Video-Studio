"""Prompt enhancement endpoint tests."""

from __future__ import annotations

from pathlib import Path


def test_enhance_prompt_uses_text_only_mode(client, wangp_bridge):
    response = client.post(
        "/api/enhance-prompt",
        json={
            "prompt": "a quiet city street",
            "mode": "video",
            "modelProfileId": "ltx2_22b_distilled",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"prompt": "enhanced: a quiet city street"}
    call = wangp_bridge.enhance_prompt_calls[-1]
    assert call.prompt == "a quiet city street"
    assert call.mode == "video"
    assert call.model_type == "ltx2_22B_distilled_1_1"
    assert call.image_path is None


def test_enhance_prompt_passes_input_image(client, wangp_bridge, tmp_path: Path):
    image_path = tmp_path / "start.png"
    image_path.write_bytes(b"fake-image")

    response = client.post(
        "/api/enhance-prompt",
        json={
            "prompt": "a portrait with soft light",
            "mode": "image",
            "modelProfileId": "z_image_turbo",
            "inputImagePath": str(image_path),
        },
    )

    assert response.status_code == 200
    call = wangp_bridge.enhance_prompt_calls[-1]
    assert call.prompt == "a portrait with soft light"
    assert call.mode == "image"
    assert call.model_type == "z_image"
    assert call.image_path == str(image_path)
