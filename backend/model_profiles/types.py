"""Shared types and input-role definitions for curated model profiles."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from model_profiles.policies import (
    DirectorRenderStrategyPolicy,
    SpeechPolicy,
    SfxPolicy,
    SystemDependency,
    VideoAudioPolicy,
    VideoEditPolicy,
)

MediaType = Literal["image", "video", "audio", "tts"]
AspectRatio = Literal[
    "1:1",
    "16:9",
    "9:16",
    "21:9",
    "9:21",
    "4:3",
    "3:4",
    "3:2",
    "2:3",
]
CURATED_ASPECT_RATIOS: tuple[AspectRatio, ...] = (
    "1:1",
    "16:9",
    "9:16",
    "21:9",
    "9:21",
    "4:3",
    "3:4",
    "3:2",
    "2:3",
)
ResolutionTier = Literal["540p", "720p", "1080p", "1440p", "2160p"]
ProfileStatus = Literal["stable", "experimental", "hidden"]
LoraSupport = Literal["supported", "unsupported", "future", "experimental"]
MusicVocalMode = Literal["instrumental", "auto-lyrics", "custom-lyrics"]
ImageInputRole = Literal[
    "reference_subject",
    "reference_people_objects",
    "control_image",
    "control_pose",
    "control_depth",
    "control_canny",
    "start_image",
    "end_image",
    "control_video",
    "audio_guide",
    "human_motion",
    "human_motion_pose",
    "depth",
    "canny_edges",
    "sdr_to_hdr",
    "continue_video",
    "audio_to_video",
    "reference_voice",
    "reference_image",
    "reference_video",
    "reference_audio",
]
ImageInputKind = Literal["reference", "control", "inpaint"]
AvailabilityState = Literal[
    "available",
    "missing_model_files",
    "partially_installed",
    "unsupported",
    "experimental",
    "hidden",
]
DirectorGuidanceMode = Literal["human_motion", "depth", "ingredients"]


@dataclass(frozen=True)
class DirectorPolicy:
    enabled: bool = False
    prompt_relay: bool = False
    injected_frames: bool = False
    continue_video: bool = False
    guide_audio_start_only: bool = False
    max_image_keyframes: int | None = None
    max_guidance_segments: int = 0
    guidance_modes: tuple[DirectorGuidanceMode, ...] = ()
    max_duration_seconds: int = 20
    allow_keyframes_with_video_guidance: bool = False
    allow_keyframes_with_ingredients: bool = False
    allow_guide_audio_with_guidance: bool = False
    render_strategies: tuple[DirectorRenderStrategyPolicy, ...] = ()


@dataclass(frozen=True)
class MusicPolicy:
    enabled: bool = False
    supports_instrumental: bool = False
    supports_auto_lyrics: bool = False
    supports_custom_lyrics: bool = False
    auto_lyrics_requires_prompt_enhancer: bool = False
    auto_fill_metadata: bool = False
    duration_min_seconds: int = 5
    duration_max_seconds: int = 360
    duration_step_seconds: int = 1
    default_duration_seconds: int = 30
    supports_bpm: bool = False
    bpm_min: int = 30
    bpm_max: int = 300
    supports_key_scale: bool = False
    supports_time_signature: bool = False
    time_signatures: tuple[str, ...] = ()
    default_vocal_mode: MusicVocalMode = "instrumental"
    max_variations: int = 1
    supports_auto_duration: bool = False
    auto_duration_fallback_seconds: int = 60
    supports_description_enhancement: bool = False
    supports_vocal_language: bool = False
    supported_languages: tuple[str, ...] = ()
    default_vocal_language: str = "en"
    supports_vocal_gender_conditioning: bool = False
    supports_cover: bool = False
    supports_reference_timbre: bool = False
    supports_compose_lyrics: bool = False
    supports_compose_thinking: bool = False
    default_cover_strength: int = 50
    default_weirdness: int = 50
    default_prompt_influence: int = 75


@dataclass(frozen=True)
class ModelLicenseInfo:
    project_license: str
    weights_license: str
    commercial_use: Literal["permitted", "restricted", "unknown"]
    attribution_required: bool
    source_project: str
    source_revision: str | None = None
    license_url: str | None = None
    notes: str = ""


@dataclass(frozen=True)
class InputMediaRole:
    role: ImageInputRole
    label: str
    description: str
    kind: ImageInputKind


@dataclass(frozen=True)
class InputMediaPolicy:
    supports_image_inputs: bool = False
    tooltip_label: str = ""
    max_images: int = 0
    max_reference_images: int = 0
    max_reference_videos: int = 0
    max_reference_audios: int = 0
    max_combined_references: int = 0
    default_role: ImageInputRole | None = None
    roles: tuple[InputMediaRole, ...] = ()
    wangp_model_type: str | None = None
    wangp_default_settings: dict[str, object] = field(default_factory=dict[str, object])
    setting_values: dict[str, object] = field(default_factory=dict[str, object])


@dataclass(frozen=True)
class WanGPModelMetadata:
    """WanGP-discovered model metadata kept separate from AiVS curation."""

    family: str
    family_label: str
    base_model_type: str
    finetune: bool
    main_output: tuple[str, ...]
    outputs: tuple[str, ...]
    inputs: tuple[str, ...]
    media_inputs: dict[str, dict[str, bool]]
    capabilities: dict[str, bool]
    setting_values: dict[str, object] = field(default_factory=dict[str, object])


@dataclass(frozen=True)
class ModelProfile:
    """A curated AiVS model profile.

    The exact ``WxH`` resolution sent to WanGP is resolved per
    ``(tier, aspect)`` by the resolution resolver — the frontend never
    sends a vague label like ``1080p`` to WanGP, only the resolved value.
    """

    id: str
    display_name: str
    media_type: MediaType
    visible: bool
    status: ProfileStatus
    wangp_model_type: str
    wangp_metadata: WanGPModelMetadata
    wangp_default_settings: dict[str, object] = field(default_factory=dict[str, object])
    text_to_image: bool = False
    text_to_video: bool = False
    image_to_video: bool = False
    video_to_video: bool = False
    audio_to_video: bool = False
    audio_output: bool = False
    text_to_audio: bool = False
    audio_to_audio: bool = False
    start_image: bool = False
    end_image: bool = False
    control_video: bool = False
    video_continuation: bool = False
    sliding_window: bool = False
    reference_images: bool = False
    control_image: bool = False
    inpainting: bool = False
    outpainting: bool = False
    masked_edit_references: bool = False
    lora: LoraSupport = "future"
    input_media: InputMediaPolicy = field(default_factory=InputMediaPolicy)
    default_aspect_ratio: AspectRatio = "1:1"
    default_resolution_tier: ResolutionTier = "720p"
    allowed_aspect_ratios: tuple[AspectRatio, ...] = CURATED_ASPECT_RATIOS
    allowed_resolution_tiers: tuple[ResolutionTier, ...] = (
        "540p",
        "720p",
        "1080p",
    )
    min_resolution_tier: ResolutionTier | None = None
    max_resolution_tier: ResolutionTier | None = None
    wangp_resolution_categories: tuple[str, ...] = ()
    max_parallel_images: int = 1
    max_total_variations: int = 12
    required_pack_ids: tuple[str, ...] = ()
    system_dependencies: tuple[SystemDependency, ...] = ()
    video_audio: VideoAudioPolicy = field(default_factory=VideoAudioPolicy)
    speech: SpeechPolicy = field(default_factory=SpeechPolicy)
    sfx: SfxPolicy = field(default_factory=SfxPolicy)
    video_edits: VideoEditPolicy = field(default_factory=VideoEditPolicy)
    director: DirectorPolicy = field(default_factory=DirectorPolicy)
    music: MusicPolicy = field(default_factory=MusicPolicy)
    license: ModelLicenseInfo | None = None


REFERENCE_SUBJECT_ROLE = InputMediaRole(
    role="reference_subject",
    label="Subject / Scene Reference",
    description="Use the image as the main subject, scene, or landscape guide.",
    kind="reference",
)
REFERENCE_PEOPLE_OBJECTS_ROLE = InputMediaRole(
    role="reference_people_objects",
    label="People / Object Reference",
    description="Use the image as a people/object reference.",
    kind="reference",
)
CONTROL_IMAGE_ROLE = InputMediaRole(
    role="control_image",
    label="Image Ref",
    description="Use the image directly as a control guide.",
    kind="control",
)
CONTROL_POSE_ROLE = InputMediaRole(
    role="control_pose",
    label="Human Pose",
    description="Extract and transfer human pose from the image.",
    kind="control",
)
CONTROL_DEPTH_ROLE = InputMediaRole(
    role="control_depth",
    label="Depth",
    description="Extract and transfer depth from the image.",
    kind="control",
)
CONTROL_CANNY_ROLE = InputMediaRole(
    role="control_canny",
    label="Canny Edges",
    description="Extract and transfer edge guidance from the image.",
    kind="control",
)
START_IMAGE_ROLE = InputMediaRole(
    role="start_image",
    label="Start Image",
    description="The video will start from this image.",
    kind="reference",
)
END_IMAGE_ROLE = InputMediaRole(
    role="end_image",
    label="End Image",
    description="The video will end at this image (optional).",
    kind="reference",
)
CONTROL_VIDEO_ROLE = InputMediaRole(
    role="control_video",
    label="Control Video",
    description="Guide the generation with a control video.",
    kind="control",
)
AUDIO_GUIDE_ROLE = InputMediaRole(
    role="audio_guide",
    label="Audio Track",
    description="Add a synchronized soundtrack/audio file.",
    kind="control",
)
HUMAN_MOTION_ROLE = InputMediaRole(
    role="human_motion",
    label="Human Motion",
    description="Transfer human motion guidance from the video.",
    kind="control",
)
HUMAN_MOTION_POSE_ROLE = InputMediaRole(
    role="human_motion_pose",
    label="Human Motion (Pose Aligned)",
    description="Transfer human motion with pose alignment.",
    kind="control",
)
DEPTH_ROLE = InputMediaRole(
    role="depth",
    label="Depth",
    description="Guide generation using depth map of the video.",
    kind="control",
)
CANNY_EDGES_ROLE = InputMediaRole(
    role="canny_edges",
    label="Canny Edges",
    description="Guide generation using Canny edge maps of the video.",
    kind="control",
)
SDR_TO_HDR_ROLE = InputMediaRole(
    role="sdr_to_hdr",
    label="Convert SDR to HDR",
    description="Convert SDR input video to HDR format using IC-LoRA.",
    kind="control",
)
CONTINUE_VIDEO_ROLE = InputMediaRole(
    role="continue_video",
    label="Continue Video",
    description="Continue video generation from the ending of a source video.",
    kind="reference",
)
AUDIO_TO_VIDEO_ROLE = InputMediaRole(
    role="audio_to_video",
    label="Audio To Video",
    description="Generate video based on soundtrack and text prompt.",
    kind="control",
)
REFERENCE_VOICE_ROLE = InputMediaRole(
    role="reference_voice",
    label="Reference Voice",
    description="Generate video using reference voice (ID-LoRA).",
    kind="control",
)
H3_REFERENCE_IMAGE_ROLE = InputMediaRole(
    role="reference_image",
    label="Reference Image",
    description="Use this image as a MiniMax H3 visual reference.",
    kind="reference",
)
H3_REFERENCE_VIDEO_ROLE = InputMediaRole(
    role="reference_video",
    label="Reference Video",
    description="Use this video as a MiniMax H3 visual reference.",
    kind="reference",
)
H3_REFERENCE_AUDIO_ROLE = InputMediaRole(
    role="reference_audio",
    label="Reference Audio",
    description="Use this audio as a MiniMax H3 audio reference.",
    kind="reference",
)


def _image_setting_values(  # pyright: ignore[reportUnusedFunction]
    *,
    video_prompt_type: dict[str, object] | None = None,
    model_mode: object = None,
    sample_solver: object = None,
    prompt_enhancer: object = None,
) -> dict[str, object]:
    return {
        "image_prompt_type": {
            "allowed": "",
            "choices": [{"label": "Text/new generation", "value": ""}],
        },
        "video_prompt_type": video_prompt_type
        or {
            "guide_preprocessing": None,
            "mask_preprocessing": None,
            "guide_custom_choices": None,
            "image_ref_choices": None,
            "custom_video_selection": None,
            "forced": "",
        },
        "audio_prompt_type": {"sources": None, "custom_option": None},
        "model_mode": model_mode,
        "sample_solver": sample_solver,
        "prompt_enhancer": prompt_enhancer,
    }
