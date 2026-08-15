"""Curated model profile registry for AiVS.

This is the stable facade for the product-facing model profile registry.
Curated definitions live in their media-specific modules; validation and
lookup behavior remain centralized here.
"""

from __future__ import annotations

from model_profiles.audio_profiles import MUSIC_PROFILES
from model_profiles.image_profiles import IMAGE_PROFILES
from model_profiles.policies import (
    DirectorRenderStrategyPolicy,
    SpeechPolicy,
    SfxPolicy,
    SystemDependency,
    VideoAudioPolicy,
    VideoEditOperationPolicy,
    VideoEditPolicy,
    validate_model_profile_policies,
)
from model_profiles.types import (
    AUDIO_GUIDE_ROLE,
    AUDIO_TO_VIDEO_ROLE,
    AvailabilityState,
    AspectRatio,
    CANNY_EDGES_ROLE,
    CONTINUE_VIDEO_ROLE,
    CONTROL_CANNY_ROLE,
    CONTROL_DEPTH_ROLE,
    CONTROL_IMAGE_ROLE,
    CONTROL_POSE_ROLE,
    CONTROL_VIDEO_ROLE,
    CURATED_ASPECT_RATIOS,
    DEPTH_ROLE,
    DirectorGuidanceMode,
    DirectorPolicy,
    END_IMAGE_ROLE,
    H3_REFERENCE_AUDIO_ROLE,
    H3_REFERENCE_IMAGE_ROLE,
    H3_REFERENCE_VIDEO_ROLE,
    HUMAN_MOTION_POSE_ROLE,
    HUMAN_MOTION_ROLE,
    ImageInputKind,
    ImageInputRole,
    InputMediaPolicy,
    InputMediaRole,
    LoraSupport,
    MediaType,
    ModelLicenseInfo,
    ModelProfile,
    MusicPolicy,
    MusicVocalMode,
    ProfileStatus,
    REFERENCE_PEOPLE_OBJECTS_ROLE,
    REFERENCE_SUBJECT_ROLE,
    REFERENCE_VOICE_ROLE,
    ResolutionTier,
    SDR_TO_HDR_ROLE,
    START_IMAGE_ROLE,
    WanGPModelMetadata,
)
from model_profiles.video_profiles import VIDEO_PROFILES
from wangp_model_packs import H3_TURBO_FL2VA_LORA_URL, PACKS


__all__ = (
    "AUDIO_GUIDE_ROLE",
    "AUDIO_TO_VIDEO_ROLE",
    "AvailabilityState",
    "AspectRatio",
    "CANNY_EDGES_ROLE",
    "CONTINUE_VIDEO_ROLE",
    "CONTROL_CANNY_ROLE",
    "CONTROL_DEPTH_ROLE",
    "CONTROL_IMAGE_ROLE",
    "CONTROL_POSE_ROLE",
    "CONTROL_VIDEO_ROLE",
    "CURATED_ASPECT_RATIOS",
    "DEPTH_ROLE",
    "DirectorGuidanceMode",
    "DirectorPolicy",
    "DirectorRenderStrategyPolicy",
    "END_IMAGE_ROLE",
    "H3_REFERENCE_AUDIO_ROLE",
    "H3_REFERENCE_IMAGE_ROLE",
    "H3_REFERENCE_VIDEO_ROLE",
    "H3_TURBO_FL2VA_LORA_URL",
    "HUMAN_MOTION_POSE_ROLE",
    "HUMAN_MOTION_ROLE",
    "IMAGE_PROFILES",
    "ImageInputKind",
    "ImageInputRole",
    "InputMediaPolicy",
    "InputMediaRole",
    "LoraSupport",
    "MUSIC_PROFILES",
    "MediaType",
    "ModelLicenseInfo",
    "ModelProfile",
    "MusicPolicy",
    "MusicVocalMode",
    "PACKS",
    "ProfileStatus",
    "REFERENCE_PEOPLE_OBJECTS_ROLE",
    "REFERENCE_SUBJECT_ROLE",
    "REFERENCE_VOICE_ROLE",
    "ResolutionTier",
    "SDR_TO_HDR_ROLE",
    "START_IMAGE_ROLE",
    "SpeechPolicy",
    "SfxPolicy",
    "SystemDependency",
    "VIDEO_PROFILES",
    "VideoAudioPolicy",
    "VideoEditOperationPolicy",
    "VideoEditPolicy",
    "WanGPModelMetadata",
    "get_image_profile",
    "get_music_profile",
    "get_video_profile",
    "get_visible_image_profiles",
    "get_visible_music_profiles",
    "get_visible_sfx_profiles",
    "get_visible_speech_profiles",
    "get_visible_video_profiles",
    "validate_model_profile_policies",
)


validate_model_profile_policies(
    [*IMAGE_PROFILES, *VIDEO_PROFILES, *MUSIC_PROFILES], pack_ids=PACKS
)


def get_image_profile(profile_id: str) -> ModelProfile | None:
    """Return the image profile with the given id, or None if not curated."""
    for profile in IMAGE_PROFILES:
        if profile.id == profile_id:
            return profile
    return None


def get_video_profile(profile_id: str) -> ModelProfile | None:
    """Return the video profile with the given id, or None if not curated."""
    for profile in VIDEO_PROFILES:
        if profile.id == profile_id:
            return profile
    return None


def get_music_profile(profile_id: str) -> ModelProfile | None:
    """Return the music profile with the given id, or None if not curated."""
    for profile in MUSIC_PROFILES:
        if profile.id == profile_id:
            return profile
    return None


def get_visible_image_profiles() -> list[ModelProfile]:
    """Return visible image profiles in display order."""
    return [profile for profile in IMAGE_PROFILES if profile.visible]


def get_visible_video_profiles() -> list[ModelProfile]:
    """Return visible video profiles in display order."""
    return [profile for profile in VIDEO_PROFILES if profile.visible]


def get_visible_music_profiles() -> list[ModelProfile]:
    """Return visible music profiles in display order."""
    return [
        profile for profile in MUSIC_PROFILES if profile.visible and profile.music.enabled
    ]


def get_visible_sfx_profiles() -> list[ModelProfile]:
    """Return visible dedicated SFX profiles in display order."""
    return [
        profile
        for profile in MUSIC_PROFILES
        if profile.visible and profile.sfx.handler == "sfx_generation"
    ]


def get_visible_speech_profiles() -> list[ModelProfile]:
    """Return visible dedicated speech profiles in display order."""
    return [
        profile
        for profile in MUSIC_PROFILES
        if profile.visible and profile.speech.handler == "speech_generation"
    ]
