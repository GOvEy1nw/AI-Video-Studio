"""Curated music, speech, and sound-effect model profiles."""

from __future__ import annotations

from model_profiles.policies import (
    SfxPolicy,
    SpeechPolicy,
)
from model_profiles.types import (
    ModelLicenseInfo,
    ModelProfile,
    MusicPolicy,
    WanGPModelMetadata,
)

_ACE_STEP_LICENSE = ModelLicenseInfo(
    project_license="MIT",
    weights_license="MIT",
    commercial_use="permitted",
    attribution_required=True,
    source_project="ACE-Step 1.5",
    notes=(
        "Licence metadata is informational, not legal advice. Users remain "
        "responsible for originality and permissions for generated music."
    ),
)


def _ace_step_metadata(*, base_model_type: str) -> WanGPModelMetadata:
    return WanGPModelMetadata(
        family="music",
        family_label="Music",
        base_model_type=base_model_type,
        finetune=False,
        main_output=("audio",),
        outputs=("audio",),
        inputs=("text", "audio"),
        media_inputs={
            "image": {
                "start": False,
                "end": False,
                "reference": False,
                "single_reference": False,
                "multiple_references": False,
                "background": False,
                "injected_frames": False,
                "control": False,
                "mask": False,
            },
            "video": {
                "continue": False,
                "last": False,
                "control": False,
                "mask": False,
            },
            "audio": {"prompt": True, "output": True},
        },
        capabilities={
            "text_to_video": False,
            "image_to_video": False,
            "video_to_video": False,
            "text_to_image": False,
            "image_to_image": False,
            "text_to_audio": True,
            "audio_to_audio": True,
            "audio_to_video": False,
            "audio_output": True,
            "inpainting": False,
            "outpainting": False,
            "reference_images": False,
            "background_image": False,
            "injected_frames": False,
            "control_image": False,
            "control_video": False,
            "video_continuation": False,
            "sliding_window": False,
            "lora": True,
        },
        setting_values={
            "duration_seconds": {"min": 5, "max": 360, "increment": 1, "default": 20},
            "custom_settings": ["bpm", "keyscale", "timesignature", "language"],
            "model_mode": [0, 1, 2, 3, 4],
            "audio_prompt_type": ["", "A", "B", "AB"],
            "sampling": ["temperature", "top_p", "top_k", "alt_guidance_scale"],
            "prompt_enhancer": "Compose Lyrics",
            "prompt_enhancer_thinking": "K",
        },
    )


_ACE_STEP_LANGUAGES = (
    "ar", "az", "bg", "bn", "ca", "cs", "da", "de", "el", "en",
    "es", "fa", "fi", "fr", "he", "hi", "hr", "ht", "hu", "id",
    "is", "it", "ja", "ko", "la", "lt", "ms", "ne", "nl", "no",
    "pa", "pl", "pt", "ro", "ru", "sa", "sk", "sr", "sv", "sw",
    "ta", "te", "th", "tl", "tr", "uk", "ur", "vi", "yue", "zh",
    "unknown",
)


_ACE_STEP_MUSIC_POLICY = MusicPolicy(
    enabled=True,
    supports_instrumental=True,
    supports_auto_lyrics=True,
    supports_custom_lyrics=True,
    auto_lyrics_requires_prompt_enhancer=True,
    auto_fill_metadata=True,
    duration_min_seconds=5,
    duration_max_seconds=360,
    duration_step_seconds=1,
    default_duration_seconds=30,
    supports_bpm=True,
    bpm_min=30,
    bpm_max=300,
    supports_key_scale=True,
    supports_time_signature=True,
    time_signatures=("2/4", "3/4", "4/4", "6/8"),
    default_vocal_mode="auto-lyrics",
    max_variations=4,
    supports_auto_duration=True,
    auto_duration_fallback_seconds=60,
    supports_description_enhancement=True,
    supports_vocal_language=True,
    supported_languages=_ACE_STEP_LANGUAGES,
    default_vocal_language="en",
    supports_vocal_gender_conditioning=True,
    supports_cover=True,
    supports_reference_timbre=True,
    supports_compose_lyrics=True,
    supports_compose_thinking=True,
)

_MMAUDIO_LICENSE = ModelLicenseInfo(
    project_license="MIT",
    weights_license="Not declared by the DeepBeepMeep/Wan2.1 repository",
    commercial_use="unknown",
    attribution_required=True,
    source_project="MMAudio / DeepBeepMeep Wan2.1",
    notes="Optional processor checkpoints are downloaded by WanGP and are not bundled with AiVS; no weights rights are inferred.",
)

_MMAUDIO_METADATA = WanGPModelMetadata(
    family="audio_processor", family_label="Sound Effects", base_model_type="mmaudio", finetune=False,
    main_output=("audio",), outputs=("audio",), inputs=("text", "video"),
    media_inputs={"image": {}, "video": {"control": True}, "audio": {"output": True}},
    capabilities={"text_to_audio": True, "video_to_audio": True, "audio_output": True},
    setting_values={"duration_seconds": {"min": 1, "max": 20, "default": 8}},
)
_TTS_METADATA = WanGPModelMetadata(
    family="speech", family_label="Speech", base_model_type="tts", finetune=False,
    main_output=("audio",), outputs=("audio",), inputs=("text", "audio"),
    media_inputs={"audio": {"reference": True, "output": True}},
    capabilities={"text_to_audio": True, "audio_to_audio": True, "audio_output": True},
)

_OMNIVOICE_LICENSE = ModelLicenseInfo(
    project_license="Not declared in the managed WanGP checkout",
    weights_license="Not declared in the managed WanGP checkout",
    commercial_use="unknown",
    attribution_required=True,
    source_project="OmniVoice / DeepBeepMeep TTS",
    notes="WanGP downloads model files on demand; no usage rights are inferred.",
)

_INDEX_TTS2_LICENSE = ModelLicenseInfo(
    project_license="Bilibili Model Use License", weights_license="Bilibili Model Use License",
    commercial_use="restricted", attribution_required=True, source_project="IndexTTS2 / bilibili",
    notes="Use is subject to the bundled local bilibili model-use license.",
)


MUSIC_PROFILES: tuple[ModelProfile, ...] = (
    ModelProfile(
        id="omnivoice", display_name="OmniVoice", media_type="audio", visible=True,
        status="experimental", wangp_model_type="omnivoice", wangp_metadata=_TTS_METADATA,
        wangp_default_settings={"audio_prompt_type": "", "model_mode": "auto"},
        text_to_audio=True, audio_to_audio=True, audio_output=True, required_pack_ids=("omnivoice",),
        speech=SpeechPolicy(status="experimental", handler="speech_generation", required_pack_ids=("omnivoice",), reference_voice=True, tts=True, max_reference_inputs=2),
        license=_OMNIVOICE_LICENSE,
    ),
    ModelProfile(
        id="index_tts2", display_name="Index TTS 2", media_type="audio", visible=True,
        status="experimental", wangp_model_type="index_tts2", wangp_metadata=_TTS_METADATA,
        wangp_default_settings={"audio_prompt_type": "A"},
        text_to_audio=True, audio_to_audio=True, audio_output=True, required_pack_ids=("index_tts2",),
        speech=SpeechPolicy(status="experimental", handler="speech_generation", required_pack_ids=("index_tts2",), reference_voice=True, tts=True, max_reference_inputs=2, reference_required=True),
        license=_INDEX_TTS2_LICENSE,
    ),
    ModelProfile(
        id="mmaudio_sfx", display_name="MMAudio Sound Effects", media_type="audio", visible=True,
        status="experimental", wangp_model_type="mmaudio", wangp_metadata=_MMAUDIO_METADATA,
        text_to_audio=True, audio_output=True, required_pack_ids=("mmaudio",),
        sfx=SfxPolicy(status="experimental", handler="sfx_generation", required_pack_ids=("mmaudio",), text=True, control_video_audio=True, max_duration_seconds=20),
        license=_MMAUDIO_LICENSE,
    ),
    ModelProfile(
        id="ace_step_15_turbo",
        display_name="ACE-Step 1.5 Fast",
        media_type="audio",
        visible=True,
        status="stable",
        wangp_model_type="ace_step_v1_5_turbo_lm_1_7b",
        wangp_metadata=_ace_step_metadata(base_model_type="ace_step_v1_5"),
        wangp_default_settings={
            "num_inference_steps": 8,
            "audio_prompt_type": "",
            "repeat_generation": 1,
        },
        text_to_audio=True,
        audio_output=True,
        lora="future",
        music=_ACE_STEP_MUSIC_POLICY,
        license=_ACE_STEP_LICENSE,
    ),
    ModelProfile(
        id="ace_step_15_xl_turbo",
        display_name="ACE-Step 1.5 XL",
        media_type="audio",
        visible=True,
        status="stable",
        wangp_model_type="ace_step_v1_5_xl_turbo_lm_1_7b",
        wangp_metadata=_ace_step_metadata(base_model_type="ace_step_v1_5_xl"),
        wangp_default_settings={
            "num_inference_steps": 8,
            "audio_prompt_type": "",
            "repeat_generation": 1,
        },
        text_to_audio=True,
        audio_output=True,
        lora="future",
        music=_ACE_STEP_MUSIC_POLICY,
        license=_ACE_STEP_LICENSE,
    ),
)

