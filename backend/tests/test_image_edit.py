from pathlib import Path

import pytest
from PIL import Image

from api_types import GenerateImageRequest, ImageEditMaskRecipe, ImageEditOutpaintRecipe
from services.image_edit import materialize_image_edit


def _write_image(path: Path, size: tuple[int, int] = (320, 240)) -> Path:
    Image.new("RGB", size, (32, 64, 96)).save(path)
    return path


def test_edit_profile_capabilities_are_explicit(client) -> None:
    response = client.get("/api/model-profiles")

    assert response.status_code == 200
    profiles = {
        profile["id"]: profile
        for profile in response.json()["profiles"]
        if profile["mediaType"] == "image"
    }
    assert profiles["flux2_klein_4b"]["capabilities"] | {
        "inpainting": True,
        "outpainting": True,
        "maskedEditReferences": False,
    } == profiles["flux2_klein_4b"]["capabilities"]
    assert profiles["krea2_turbo_edit"]["capabilities"] | {
        "inpainting": True,
        "outpainting": True,
        "maskedEditReferences": False,
    } == profiles["krea2_turbo_edit"]["capabilities"]
    assert profiles["qwen_image_edit_plus2_20B"]["capabilities"] | {
        "inpainting": True,
        "outpainting": True,
        "maskedEditReferences": True,
    } == profiles["qwen_image_edit_plus2_20B"]["capabilities"]
    assert profiles["hidream_o1_dev"]["capabilities"] | {
        "inpainting": False,
        "outpainting": False,
        "maskedEditReferences": False,
    } == profiles["hidream_o1_dev"]["capabilities"]


def test_text_and_reference_edit_routes_master_image_first(
    client,
    enable_wangp,
    tmp_path: Path,
) -> None:
    master = _write_image(tmp_path / "master.png")
    reference = _write_image(tmp_path / "reference.png")

    response = client.post(
        "/api/generate-image",
        json={
            "prompt": "Replace the chair",
            "modelProfileId": "krea2_turbo_edit",
            "aspectRatio": "1:1",
            "resolutionTier": "720p",
            "edit": {"image": {"path": str(master)}},
            "inputMedia": [
                {
                    "type": "image",
                    "path": str(reference),
                    "role": "reference_people_objects",
                }
            ],
        },
    )

    assert response.status_code == 200
    call = enable_wangp.image_calls[0]
    assert call.default_settings["image_mode"] == 1
    assert call.default_settings["video_prompt_type"] == "KI"
    assert call.default_settings["image_refs"] == [
        str(master.resolve()),
        str(reference.resolve()),
    ]


def test_mask_and_outpaint_use_native_masked_denoising(
    test_state,
    enable_wangp,
    tmp_path: Path,
) -> None:
    master = _write_image(tmp_path / "master.png")
    reference = _write_image(tmp_path / "reference.png")

    request_data = {
        "prompt": "Open the scene to a mountain valley",
        "modelProfileId": "qwen_image_edit_plus2_20B",
        "aspectRatio": "16:9",
        "resolutionTier": "720p",
        "edit": {
            "image": {"path": str(master)},
            "mask": {
                "schemaVersion": 1,
                "operations": [
                    {
                        "kind": "brush",
                        "size": 0.08,
                        "points": [
                            {"x": 0.4, "y": 0.4},
                            {"x": 0.6, "y": 0.6},
                        ],
                    },
                    {
                        "kind": "ellipse",
                        "x": 0.2,
                        "y": 0.2,
                        "width": 0.25,
                        "height": 0.3,
                    },
                ],
            },
            "outpaint": {
                "aspectMode": "16:9",
                "padding": {
                    "top": 10,
                    "bottom": 10,
                    "left": 25,
                    "right": 25,
                },
            },
        },
        "inputMedia": [
            {
                "type": "image",
                "path": str(reference),
                "role": "reference_people_objects",
            }
        ],
    }
    response = test_state.image_generation.generate(
        GenerateImageRequest.model_validate(request_data)
    )

    assert response.status == "complete"
    call = enable_wangp.image_calls[0]
    settings = call.default_settings
    assert settings["image_mode"] == 2
    assert settings["model_mode"] == 0
    assert settings["video_prompt_type"] == "VAGI"
    assert settings["image_refs"] == [str(reference.resolve())]
    assert not Path(str(settings["image_guide"])).exists()
    assert not Path(str(settings["image_mask"])).exists()


def test_standalone_krea_outpaint_uses_directional_wangp_contract(
    test_state,
    enable_wangp,
    tmp_path: Path,
) -> None:
    master = _write_image(tmp_path / "custom-master.png", (1600, 900))

    request_data = {
        "modelProfileId": "krea2_turbo_edit",
        "aspectRatio": "16:9",
        "resolutionTier": "720p",
        "edit": {
            "image": {"path": str(master)},
            "outpaint": {
                "aspectMode": "custom",
                "padding": {
                    "top": 0.1,
                    "bottom": 25,
                    "left": 0,
                    "right": 0,
                },
            },
        },
    }
    response = test_state.image_generation.generate(
        GenerateImageRequest.model_validate(request_data)
    )

    assert response.status == "complete"
    call = enable_wangp.image_calls[0]
    settings = call.default_settings
    assert call.prompt == "outpaint"
    assert settings["image_mode"] == 2
    assert settings["model_mode"] == 0
    assert settings["video_prompt_type"] == "VAG"
    assert settings["video_guide_outpainting"] == "1 25 0 0"
    assert settings["video_guide_outpainting_ratio"] == ""
    assert "image_refs" not in settings
    assert not Path(str(settings["image_guide"])).exists()
    assert not Path(str(settings["image_mask"])).exists()

    with pytest.raises(ValueError, match="prompt is required unless an outpaint edit is provided"):
        GenerateImageRequest.model_validate({})


@pytest.mark.parametrize("profile_id", ["flux2_klein_4b", "flux2_klein_9b"])
def test_flux_klein_reframe_materializes_red_guide_background(
    test_state,
    enable_wangp,
    monkeypatch,
    tmp_path: Path,
    profile_id: str,
) -> None:
    master = _write_image(tmp_path / f"{profile_id}.png", (1600, 900))
    backgrounds: list[tuple[int, int, int]] = []

    def capture_materializer(*args, **kwargs):
        guide_path, mask_path = materialize_image_edit(*args, **kwargs)
        with Image.open(guide_path) as guide:
            backgrounds.append(guide.getpixel((0, 0)))
        return guide_path, mask_path

    monkeypatch.setattr(
        "handlers.image_generation_handler.materialize_image_edit",
        capture_materializer,
    )
    response = test_state.image_generation.generate(
        GenerateImageRequest.model_validate(
            {
                "prompt": "Extend the scene",
                "modelProfileId": profile_id,
                "aspectRatio": "16:9",
                "resolutionTier": "720p",
                "edit": {
                    "image": {"path": str(master)},
                    "outpaint": {
                        "aspectMode": "custom",
                        "padding": {"top": 25, "bottom": 0, "left": 0, "right": 0},
                    },
                },
            }
        )
    )

    assert response.status == "complete"
    assert backgrounds == [(255, 0, 0)]
    settings = enable_wangp.image_calls[0].default_settings
    assert not Path(str(settings["image_guide"])).exists()
    assert not Path(str(settings["image_mask"])).exists()


@pytest.mark.parametrize(
    "profile_id",
    [
        "flux2_klein_4b",
        "flux2_klein_9b",
        "krea2_turbo_edit",
        "qwen_image_edit_plus2_20B",
    ],
)
def test_every_native_edit_profile_uses_masked_denoising(
    client,
    enable_wangp,
    tmp_path: Path,
    profile_id: str,
) -> None:
    master = _write_image(tmp_path / f"{profile_id}.png")

    response = client.post(
        "/api/generate-image",
        json={
            "prompt": "Replace the chair",
            "modelProfileId": profile_id,
            "aspectRatio": "1:1",
            "resolutionTier": "720p",
            "edit": {
                "image": {"path": str(master)},
                "mask": {
                    "schemaVersion": 1,
                    "operations": [
                        {
                            "kind": "rectangle",
                            "x": 0.2,
                            "y": 0.2,
                            "width": 0.5,
                            "height": 0.5,
                        }
                    ],
                },
            },
        },
    )

    assert response.status_code == 200
    settings = enable_wangp.image_calls[0].default_settings
    assert settings["image_mode"] == 2
    assert settings["model_mode"] == 0


def test_masked_edit_rejects_non_native_profile(
    client,
    enable_wangp,
    tmp_path: Path,
) -> None:
    master = _write_image(tmp_path / "master.png")

    response = client.post(
        "/api/generate-image",
        json={
            "prompt": "Replace the chair",
            "modelProfileId": "hidream_o1_dev",
            "aspectRatio": "1:1",
            "resolutionTier": "720p",
            "edit": {
                "image": {"path": str(master)},
                "mask": {
                    "schemaVersion": 1,
                    "operations": [
                        {
                            "kind": "rectangle",
                            "x": 0.2,
                            "y": 0.2,
                            "width": 0.5,
                            "height": 0.5,
                        }
                    ],
                },
            },
        },
    )

    assert response.status_code == 400
    assert "INPAINTING_NOT_SUPPORTED" in response.json()["error"]
    assert enable_wangp.image_calls == []


def test_retouch_rasterizer_preserves_source_aspect_ratio(
    tmp_path: Path,
) -> None:
    source = _write_image(tmp_path / "wide-master.png", (320, 180))
    mask_recipe = ImageEditMaskRecipe.model_validate(
        {
            "schemaVersion": 1,
            "operations": [
                {
                    "kind": "rectangle",
                    "x": 0.25,
                    "y": 0.25,
                    "width": 0.5,
                    "height": 0.5,
                }
            ],
        }
    )

    guide_path, mask_path = materialize_image_edit(
        source,
        width=512,
        height=512,
        mask_recipe=mask_recipe,
        outpaint=None,
    )
    try:
        with Image.open(guide_path) as guide, Image.open(mask_path) as mask:
            assert guide.size == mask.size
            assert abs(guide.width / guide.height - 16 / 9) < 0.02
    finally:
        guide_path.unlink(missing_ok=True)
        mask_path.unlink(missing_ok=True)


def test_mask_rasterizer_combines_outpaint_and_inpaint(
    tmp_path: Path,
) -> None:
    source = _write_image(tmp_path / "master.png", (100, 100))
    mask_recipe = ImageEditMaskRecipe.model_validate(
        {
            "schemaVersion": 1,
            "operations": [
                {
                    "kind": "rectangle",
                    "x": 0.4,
                    "y": 0.4,
                    "width": 0.2,
                    "height": 0.2,
                }
            ],
        }
    )
    outpaint = ImageEditOutpaintRecipe.model_validate(
        {
            "aspectMode": "16:9",
            "padding": {
                "top": 0,
                "bottom": 0,
                "left": 50,
                "right": 50,
            },
        }
    )

    guide_path, mask_path = materialize_image_edit(
        source,
        width=160,
        height=90,
        mask_recipe=mask_recipe,
        outpaint=outpaint,
    )
    try:
        with Image.open(guide_path) as guide, Image.open(mask_path) as mask:
            assert guide.size == (160, 90)
            assert mask.size == (160, 90)
            assert mask.getpixel((5, 45)) == 255
            assert mask.getpixel((45, 10)) == 0
            assert mask.getpixel((80, 45)) == 255
    finally:
        guide_path.unlink(missing_ok=True)
        mask_path.unlink(missing_ok=True)


def test_custom_outpaint_reallocates_budget_to_authored_frame(
    tmp_path: Path,
) -> None:
    source = _write_image(tmp_path / "custom-master.png", (1600, 900))
    outpaint = ImageEditOutpaintRecipe.model_validate(
        {
            "aspectMode": "custom",
            "padding": {
                "top": 25,
                "bottom": 25,
                "left": 0,
                "right": 0,
            },
        }
    )

    guide_path, mask_path = materialize_image_edit(
        source,
        width=512,
        height=512,
        mask_recipe=None,
        outpaint=outpaint,
    )
    try:
        with Image.open(guide_path) as guide, Image.open(mask_path) as mask:
            assert guide.size == mask.size
            assert abs(guide.width / guide.height - 1600 / 1350) < 0.02
    finally:
        guide_path.unlink(missing_ok=True)
        mask_path.unlink(missing_ok=True)
