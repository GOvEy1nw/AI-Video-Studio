"""Curated Quick Music profile contract tests."""

from model_profiles import get_music_profile, get_visible_music_profiles


def test_visible_music_profiles_are_curated_music_models() -> None:
    profiles = get_visible_music_profiles()
    assert [profile.id for profile in profiles] == [
        "ace_step_15_turbo",
        "ace_step_15_xl_turbo",
        "minimax_music3",
    ]
    assert [profile.wangp_model_type for profile in profiles] == [
        "ace_step_v1_5_turbo_lm_1_7b",
        "ace_step_v1_5_xl_turbo_lm_1_7b",
        "minimax_music3",
    ]


def test_music_profile_policy_matches_verified_wangp_schema() -> None:
    profile = get_music_profile("ace_step_15_turbo")
    assert profile is not None
    assert profile.media_type == "audio"
    assert profile.text_to_audio is True
    assert profile.wangp_metadata.family == "music"
    assert profile.wangp_metadata.main_output == ("audio",)
    assert profile.wangp_metadata.inputs == ("text", "audio")
    assert profile.wangp_metadata.capabilities["audio_to_audio"] is True
    assert profile.audio_to_audio is False
    assert profile.music.duration_min_seconds == 5
    assert profile.music.duration_max_seconds == 360
    assert profile.music.bpm_min == 30
    assert profile.music.bpm_max == 300
    assert profile.music.time_signatures == ("2/4", "3/4", "4/4", "6/8")
    assert profile.music.max_variations == 4
    assert profile.music.supports_auto_duration is True
    assert profile.music.auto_duration_fallback_seconds == 60
    assert profile.music.supports_description_enhancement is True
    assert profile.music.supports_vocal_language is True
    assert "en" in profile.music.supported_languages
    assert profile.music.supports_vocal_gender_conditioning is True
    assert profile.music.supports_cover is True
    assert profile.music.supports_reference_timbre is True
    assert profile.music.supports_compose_lyrics is True
    assert profile.music.supports_compose_thinking is True


def test_minimax_music3_profile_only_exposes_verified_controls() -> None:
    profile = get_music_profile("minimax_music3")
    assert profile is not None
    assert profile.status == "experimental"
    assert profile.wangp_model_type == "minimax_music3"
    assert profile.required_pack_ids == ("minimax_music3",)
    assert profile.music.duration_min_seconds == 1
    assert profile.music.duration_max_seconds == 300
    assert profile.music.default_duration_seconds == 30
    assert profile.music.supports_auto_lyrics is True
    assert profile.music.supports_custom_lyrics is True
    assert profile.music.supports_instrumental is False
    assert profile.music.supports_cover is False
    assert profile.music.supports_reference_timbre is False
    assert profile.wangp_default_settings["num_inference_steps"] == 30
    assert profile.wangp_default_settings["guidance_scale"] == 1.7
    assert profile.license is not None
    assert profile.license.commercial_use == "restricted"
    assert profile.license.attribution_required is True
    assert profile.license.source_revision == "fbdf52fbaaca799592917417eb05f1899f1255ec"


def test_profile_api_includes_music_policy(client) -> None:
    response = client.get("/api/model-profiles")
    assert response.status_code == 200
    profiles = {profile["id"]: profile for profile in response.json()["profiles"]}
    music = profiles["ace_step_15_turbo"]
    assert music["capabilities"]["textToAudio"] is True
    assert music["music"]["enabled"] is True
    assert music["music"]["defaultDurationSeconds"] == 30
    assert music["music"]["supportsAutoDuration"] is True
    assert music["music"]["autoDurationFallbackSeconds"] == 60
    assert music["music"]["defaultVocalLanguage"] == "en"
    assert music["music"]["defaultWeirdness"] == 50
    assert music["music"]["defaultPromptInfluence"] == 75
    assert music["license"]["sourceProject"] == "ACE-Step 1.5"
    minimax = profiles["minimax_music3"]
    assert minimax["status"] == "experimental"
    assert minimax["music"]["durationMinSeconds"] == 1
    assert minimax["music"]["durationMaxSeconds"] == 300
    assert minimax["music"]["supportsInstrumental"] is False
    assert minimax["license"]["commercialUse"] == "restricted"
    assert profiles["z_image_turbo"]["music"]["enabled"] is False
