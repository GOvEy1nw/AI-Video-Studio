"""Curated Quick Music profile contract tests."""

from model_profiles import get_music_profile, get_visible_music_profiles


def test_visible_music_profiles_are_curated_ace_step_models() -> None:
    profiles = get_visible_music_profiles()
    assert [profile.id for profile in profiles] == [
        "ace_step_15_turbo",
        "ace_step_15_xl_turbo",
    ]
    assert [profile.wangp_model_type for profile in profiles] == [
        "ace_step_v1_5_turbo_lm_1_7b",
        "ace_step_v1_5_xl_turbo_lm_1_7b",
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


def test_profile_api_includes_music_policy(client) -> None:
    response = client.get("/api/model-profiles")
    assert response.status_code == 200
    profiles = {profile["id"]: profile for profile in response.json()["profiles"]}
    music = profiles["ace_step_15_turbo"]
    assert music["capabilities"]["textToAudio"] is True
    assert music["music"]["enabled"] is True
    assert music["music"]["defaultDurationSeconds"] == 30
    assert music["license"]["sourceProject"] == "ACE-Step 1.5"
    assert profiles["z_image_turbo"]["music"]["enabled"] is False
