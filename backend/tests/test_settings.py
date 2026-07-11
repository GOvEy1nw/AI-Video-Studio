"""Tests for GET /api/settings and POST /api/settings."""

from __future__ import annotations

import json

from pydantic import ValidationError

from state.app_settings import AppSettings, OutputSettings, UpdateSettingsRequest
from state import build_initial_state
from app_handler import ServiceBundle
from tests.fakes.services import FakeServices


class TestGetSettings:
    def test_default_settings(self, client, default_app_settings):
        r = client.get("/api/settings")
        assert r.status_code == 200
        data = r.json()
        assert data["useTorchCompile"] is False
        assert data["loadOnStartup"] is False
        assert data["useLocalTextEncoder"] is False
        assert data["fastModel"] == {"useUpscaler": True}
        assert data["proModel"] == {"steps": 20, "useUpscaler": True}
        assert data["promptCacheSize"] == 100
        assert data["promptEnhancerEnabledT2V"] is True
        assert data["promptEnhancerEnabledI2V"] is False
        assert data["seedLocked"] is False
        assert data["lockedSeed"] == 42
        assert data["outputSettings"]["videoContainer"] == "mp4"
        assert data["outputSettings"]["videoCodec"] == "libx264_8"
        assert data["outputSettings"]["imageCodec"] == "jpeg"
        assert data["outputSettings"]["imageQuality"] == 95
        assert data["outputSettings"]["audioCodec"] == "aac_192"
        assert data["outputSettings"]["metadataMode"] == "metadata"
        assert "ltxApiKey" not in data
        assert "falApiKey" not in data
        assert "geminiApiKey" not in data

    def test_reflects_changed_settings(self, client, test_state):
        test_state.state.app_settings.use_torch_compile = True
        r = client.get("/api/settings")
        assert r.json()["useTorchCompile"] is True

class TestPostSettings:
    def test_update_single_field(self, client, test_state):
        r = client.post("/api/settings", json={"useTorchCompile": True})
        assert r.status_code == 200
        assert test_state.state.app_settings.use_torch_compile is True

    def test_update_multiple_fields(self, client, test_state):
        r = client.post("/api/settings", json={"useTorchCompile": True, "loadOnStartup": True})
        assert r.status_code == 200
        assert test_state.state.app_settings.use_torch_compile is True
        assert test_state.state.app_settings.load_on_startup is True

    def test_update_fast_model(self, client, test_state):
        r = client.post("/api/settings", json={"fastModel": {"useUpscaler": False}})
        assert r.status_code == 200
        assert test_state.state.app_settings.fast_model.use_upscaler is False

    def test_update_pro_model(self, client, test_state):
        r = client.post("/api/settings", json={"proModel": {"steps": 30, "useUpscaler": False}})
        assert r.status_code == 200
        assert test_state.state.app_settings.pro_model.steps == 30
        assert test_state.state.app_settings.pro_model.use_upscaler is False

    def test_deep_partial_patch_preserves_nested_fields(self, client, test_state):
        assert test_state.state.app_settings.pro_model.use_upscaler is True
        r = client.post("/api/settings", json={"proModel": {"steps": 30}})
        assert r.status_code == 200
        assert test_state.state.app_settings.pro_model.steps == 30
        assert test_state.state.app_settings.pro_model.use_upscaler is True

    def test_prompt_cache_size_clamped_max(self, client, test_state):
        r = client.post("/api/settings", json={"promptCacheSize": 5000})
        assert r.status_code == 200
        assert test_state.state.app_settings.prompt_cache_size <= 1000

    def test_prompt_cache_size_clamped_min(self, client, test_state):
        r = client.post("/api/settings", json={"promptCacheSize": -10})
        assert r.status_code == 200
        assert test_state.state.app_settings.prompt_cache_size >= 0

    def test_locked_seed_clamped_range(self, client, test_state):
        r = client.post("/api/settings", json={"lockedSeed": 9_999_999_999})
        assert r.status_code == 200
        assert test_state.state.app_settings.locked_seed == 2_147_483_647

    def test_unknown_field_rejected(self, client):
        r = client.post("/api/settings", json={"unknownSetting": True})
        assert r.status_code == 422

    def test_update_output_settings(self, client, test_state):
        r = client.post(
            "/api/settings",
            json={
                "outputSettings": {
                    "videoContainer": "mov",
                    "videoCodec": "prores_422",
                    "imageCodec": "webp_lossless",
                    "audioCodec": "aac_320",
                    "metadataMode": "json",
                    "keepIntermediateSlidingWindows": True,
                },
            },
        )
        assert r.status_code == 200
        output = test_state.state.app_settings.output_settings
        assert output.video_container == "mov"
        assert output.video_codec == "prores_422"
        assert output.image_codec == "webp_lossless"
        assert output.audio_codec == "aac_320"
        assert output.metadata_mode == "json"
        assert output.keep_intermediate_sliding_windows is True

    def test_output_settings_reject_prores_mp4(self):
        try:
            OutputSettings(videoContainer="mp4", videoCodec="prores_422")
        except ValidationError:
            return
        raise AssertionError("ProRes MP4 should be rejected")


class TestSettingsPersistence:
    def _new_state(self, test_state, default_app_settings):
        fake_services = FakeServices()
        bundle = ServiceBundle(
            gpu_info=fake_services.gpu_info,
        )
        return build_initial_state(test_state.config, default_app_settings.model_copy(deep=True), service_bundle=bundle)

    def test_load_settings_clamps_from_disk(self, test_state, default_app_settings):
        test_state.config.settings_file.write_text(
            json.dumps(
                {
                    "prompt_cache_size": 5000,
                    "locked_seed": -55,
                    "pro_model": {"steps": 999},
                }
            ),
            encoding="utf-8",
        )

        loaded = self._new_state(test_state, default_app_settings)
        assert loaded.state.app_settings.prompt_cache_size == 1000
        assert loaded.state.app_settings.locked_seed == 0
        assert loaded.state.app_settings.pro_model.steps == 100

    def test_legacy_prompt_enhancer_key_migrates(self, test_state, default_app_settings):
        test_state.config.settings_file.write_text(
            json.dumps({"prompt_enhancer_enabled": False}),
            encoding="utf-8",
        )

        loaded = self._new_state(test_state, default_app_settings)
        assert loaded.state.app_settings.prompt_enhancer_enabled_t2v is False
        assert loaded.state.app_settings.prompt_enhancer_enabled_i2v is False

    def test_legacy_api_secrets_are_removed_on_save(self, test_state, default_app_settings):
        test_state.config.settings_file.write_text(
            json.dumps(
                {
                    "ltxApiKey": "secret",
                    "fal_api_key": "secret",
                    "geminiApiKey": "secret",
                    "userPrefersLtxApiVideoGenerations": True,
                    "seed_locked": True,
                }
            ),
            encoding="utf-8",
        )

        loaded = self._new_state(test_state, default_app_settings)
        loaded.settings.save_settings()
        saved = json.loads(test_state.config.settings_file.read_text(encoding="utf-8"))
        assert "ltx_api_key" not in saved
        assert "fal_api_key" not in saved
        assert "gemini_api_key" not in saved
        assert "user_prefers_ltx_api_video_generations" not in saved
        assert saved["seed_locked"] is True


class TestSettingsSchemaDrift:
    def test_update_request_tracks_app_settings_fields(self):
        assert set(AppSettings.model_fields) == set(UpdateSettingsRequest.model_fields)
