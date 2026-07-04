"""Tests for the curated model profile registry and resolution resolver."""

from __future__ import annotations

import pytest

from _routes._errors import HTTPError
from model_profiles import (
    get_image_profile,
    get_visible_image_profiles,
    is_combination_supported,
    resolve_resolution,
)
from model_profiles.profiles import IMAGE_PROFILES


class TestCuratedProfiles:
    def test_four_visible_image_profiles(self) -> None:
        visible = get_visible_image_profiles()
        assert len(visible) == 4
        assert {p.id for p in visible} == {
            "z_image_turbo",
            "krea2_turbo",
            "flux2_klein_4b",
            "hidream_o1_dev",
        }

    def test_z_image_turbo_is_stable(self) -> None:
        profile = get_image_profile("z_image_turbo")
        assert profile is not None
        assert profile.status == "stable"
        assert profile.wangp_model_type == "z_image"
        assert profile.text_to_image is True
        assert profile.reference_images is False
        assert profile.lora == "future"

    def test_krea2_turbo_is_experimental(self) -> None:
        profile = get_image_profile("krea2_turbo")
        assert profile is not None
        assert profile.status == "experimental"
        assert profile.wangp_model_type == "krea2_turbo"
        assert profile.wangp_default_settings == {
            "image_mode": 1,
            "num_inference_steps": 8,
            "guidance_scale": 0,
        }
        assert "1440p" in profile.allowed_resolution_tiers

    def test_flux2_klein_4b_is_experimental(self) -> None:
        profile = get_image_profile("flux2_klein_4b")
        assert profile is not None
        assert profile.status == "experimental"
        assert profile.wangp_model_type == "flux2_klein_4b"
        assert profile.text_to_image is True
        assert profile.reference_images is False
        assert "1440p" in profile.allowed_resolution_tiers

    def test_hidream_o1_dev_is_experimental(self) -> None:
        profile = get_image_profile("hidream_o1_dev")
        assert profile is not None
        assert profile.status == "experimental"
        assert profile.wangp_model_type == "hidream_o1_dev"
        assert profile.display_name == "HiDream O1"
        assert "1440p" in profile.allowed_resolution_tiers

    def test_unknown_profile_returns_none(self) -> None:
        assert get_image_profile("does_not_exist") is None

    def test_no_krea2_raw_exposed(self) -> None:
        # Phase 4 brief: do not expose Krea 2 Raw in this phase.
        ids = {p.id for p in IMAGE_PROFILES}
        assert "krea2_raw" not in ids
        assert "krea2_turbo" in ids

    def test_curated_aspect_ratios_only(self) -> None:
        # Phase 4 brief: only 1:1, 16:9, 9:16.
        for profile in IMAGE_PROFILES:
            assert set(profile.allowed_aspect_ratios) <= {"1:1", "16:9", "9:16"}

    def test_no_4k_tier_by_default(self) -> None:
        # Phase 4 brief: no 4K/2160p by default.
        for profile in IMAGE_PROFILES:
            assert "2160p" not in profile.allowed_resolution_tiers

    def test_minimum_540p_floor(self) -> None:
        for profile in IMAGE_PROFILES:
            assert "540p" in profile.allowed_resolution_tiers or (
                profile.min_resolution_tier is not None
                and profile.min_resolution_tier >= "540p"  # noqa: E501
            )


class TestResolutionResolver:
    def test_1080p_landscape_maps_to_1920x1088(self) -> None:
        profile = get_image_profile("z_image_turbo")
        assert profile is not None
        assert resolve_resolution(profile, "1080p", "16:9") == (1920, 1088)

    def test_1080p_portrait_maps_to_1088x1920(self) -> None:
        profile = get_image_profile("z_image_turbo")
        assert profile is not None
        assert resolve_resolution(profile, "1080p", "9:16") == (1088, 1920)

    def test_1080p_square_picks_lower_pixel_count(self) -> None:
        # Phase 4 brief: 1080p 1:1 -> 1088x1088, not 1440x1440.
        profile = get_image_profile("z_image_turbo")
        assert profile is not None
        assert resolve_resolution(profile, "1080p", "1:1") == (1088, 1088)

    def test_720p_landscape_maps_to_1280x720(self) -> None:
        profile = get_image_profile("z_image_turbo")
        assert profile is not None
        assert resolve_resolution(profile, "720p", "16:9") == (1280, 720)

    def test_720p_portrait_maps_to_720x1280(self) -> None:
        profile = get_image_profile("z_image_turbo")
        assert profile is not None
        assert resolve_resolution(profile, "720p", "9:16") == (720, 1280)

    def test_krea2_1440p_supported(self) -> None:
        profile = get_image_profile("krea2_turbo")
        assert profile is not None
        assert resolve_resolution(profile, "1440p", "16:9") == (2560, 1440)

    def test_z_image_1440p_not_curated(self) -> None:
        # Z-Image Turbo profile caps at 1080p.
        profile = get_image_profile("z_image_turbo")
        assert profile is not None
        assert is_combination_supported(profile, "1440p", "16:9") is False

    def test_flux2_klein_1440p_supported(self) -> None:
        profile = get_image_profile("flux2_klein_4b")
        assert profile is not None
        assert resolve_resolution(profile, "1440p", "16:9") == (2560, 1440)

    def test_hidream_o1_1080p_square(self) -> None:
        profile = get_image_profile("hidream_o1_dev")
        assert profile is not None
        assert resolve_resolution(profile, "1080p", "1:1") == (1088, 1088)

    def test_unknown_combination_raises(self) -> None:
        profile = get_image_profile("z_image_turbo")
        assert profile is not None
        with pytest.raises(KeyError):
            resolve_resolution(profile, "2160p", "16:9")


class TestModelProfilesEndpoint:
    def test_list_profiles_returns_visible_profiles(self, client) -> None:
        r = client.get("/api/model-profiles")
        assert r.status_code == 200
        data = r.json()
        ids = [p["id"] for p in data["profiles"]]
        assert ids == ["z_image_turbo", "krea2_turbo", "flux2_klein_4b", "hidream_o1_dev"]

    def test_profile_shape(self, client) -> None:
        r = client.get("/api/model-profiles")
        data = r.json()
        krea = next(p for p in data["profiles"] if p["id"] == "krea2_turbo")
        assert krea["displayName"] == "Krea 2 Turbo"
        assert krea["mediaType"] == "image"
        assert krea["status"] == "experimental"
        assert krea["wangpModelType"] == "krea2_turbo"
        assert krea["capabilities"]["textToImage"] is True
        assert krea["capabilities"]["referenceImages"] is False
        assert krea["capabilities"]["lora"] == "future"
        assert krea["ui"]["defaultAspectRatio"] == "1:1"
        assert krea["ui"]["defaultResolutionTier"] == "720p"
        assert set(krea["ui"]["allowedAspectRatios"]) == {"1:1", "16:9", "9:16"}
        assert "1440p" in krea["ui"]["allowedResolutionTiers"]

    def test_availability_reflects_wangp_bridge(
        self, client, test_state, wangp_bridge
    ) -> None:
        # Bridge unavailable -> profiles report missing model files.
        wangp_bridge.enabled = False
        r = client.get("/api/model-profiles")
        data = r.json()
        for profile in data["profiles"]:
            assert profile["availability"] == "missing_model_files"

        # Bridge available -> availability flips.
        wangp_bridge.enabled = True
        wangp_bridge.available = True
        r = client.get("/api/model-profiles")
        data = r.json()
        for profile in data["profiles"]:
            if profile["status"] == "experimental":
                assert profile["availability"] == "experimental"
            else:
                assert profile["availability"] == "available"


class TestImageGenerationProfileRouting:
    def test_profile_request_routes_to_krea2(
        self, client, enable_wangp
    ) -> None:
        r = client.post(
            "/api/generate-image",
            json={
                "prompt": "A cat",
                "modelProfileId": "krea2_turbo",
                "aspectRatio": "16:9",
                "resolutionTier": "1080p",
            },
        )
        assert r.status_code == 200
        call = enable_wangp.image_calls[0]
        assert call.model_type == "krea2_turbo"
        assert call.width == 1920
        assert call.height == 1088
        assert call.num_steps == 8
        assert call.default_settings == {
            "image_mode": 1,
            "num_inference_steps": 8,
            "guidance_scale": 0,
        }

    def test_profile_request_routes_to_z_image(
        self, client, enable_wangp
    ) -> None:
        r = client.post(
            "/api/generate-image",
            json={
                "prompt": "A cat",
                "modelProfileId": "z_image_turbo",
                "aspectRatio": "1:1",
                "resolutionTier": "720p",
            },
        )
        assert r.status_code == 200
        call = enable_wangp.image_calls[0]
        assert call.model_type == "z_image"
        assert call.width == 1024
        assert call.height == 1024

    def test_profile_request_routes_to_flux2_klein(
        self, client, enable_wangp
    ) -> None:
        r = client.post(
            "/api/generate-image",
            json={
                "prompt": "A cat",
                "modelProfileId": "flux2_klein_4b",
                "aspectRatio": "16:9",
                "resolutionTier": "1080p",
            },
        )
        assert r.status_code == 200
        call = enable_wangp.image_calls[0]
        assert call.model_type == "flux2_klein_4b"
        assert call.width == 1920
        assert call.height == 1088

    def test_profile_request_routes_to_hidream(
        self, client, enable_wangp
    ) -> None:
        r = client.post(
            "/api/generate-image",
            json={
                "prompt": "A cat",
                "modelProfileId": "hidream_o1_dev",
                "aspectRatio": "1:1",
                "resolutionTier": "720p",
            },
        )
        assert r.status_code == 200
        call = enable_wangp.image_calls[0]
        assert call.model_type == "hidream_o1_dev"
        assert call.width == 1024
        assert call.height == 1024

    def test_unknown_profile_rejected(self, client, enable_wangp) -> None:
        r = client.post(
            "/api/generate-image",
            json={
                "prompt": "test",
                "modelProfileId": "definitely_not_a_real_profile",
                "aspectRatio": "16:9",
                "resolutionTier": "1080p",
            },
        )
        assert r.status_code == 400
        assert "UNKNOWN_MODEL_PROFILE" in r.json()["error"]

    def test_unsupported_tier_rejected(self, client, enable_wangp) -> None:
        r = client.post(
            "/api/generate-image",
            json={
                "prompt": "test",
                "modelProfileId": "z_image_turbo",
                "aspectRatio": "16:9",
                "resolutionTier": "1440p",
            },
        )
        assert r.status_code == 400
        assert "UNSUPPORTED_RESOLUTION_TIER" in r.json()["error"]

    def test_unsupported_aspect_rejected(self, client, enable_wangp) -> None:
        r = client.post(
            "/api/generate-image",
            json={
                "prompt": "test",
                "modelProfileId": "z_image_turbo",
                "aspectRatio": "21:9",
                "resolutionTier": "1080p",
            },
        )
        # 21:9 is not in the Literal at all — pydantic rejects with 422.
        assert r.status_code == 422

    def test_backwards_compatible_raw_dimensions_still_work(
        self, client, enable_wangp
    ) -> None:
        # No modelProfileId — falls back to configured default (z_image)
        # and raw width/height are 16-aligned.
        r = client.post(
            "/api/generate-image",
            json={"prompt": "test", "width": 1023, "height": 1023},
        )
        assert r.status_code == 200
        call = enable_wangp.image_calls[0]
        assert call.model_type == "z_image"
        assert call.width == 1008
        assert call.height == 1008
