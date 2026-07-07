"""Curated model profile registry for AiVS.

This is the product-facing source of truth for which models appear in the
AiVS UI. Per the Phase 4 brief: 'WanGP tells us what can exist; AiVS
decides what should be visible.' WanGP discovery is used for
validation/availability only — never as the raw UI source.

Each profile maps an AiVS-facing ``id`` to a WanGP ``model_type`` plus the
curated UI surface (aspect ratios, resolution tiers, capabilities, default
settings). Adding a model means adding a profile here; the frontend reads
the list from the backend API.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

MediaType = Literal["image", "video", "audio", "tts"]
AspectRatio = Literal["1:1", "16:9", "9:16"]
ResolutionTier = Literal["540p", "720p", "1080p", "1440p", "2160p"]
ProfileStatus = Literal["stable", "experimental", "hidden"]
LoraSupport = Literal["supported", "unsupported", "future", "experimental"]
AvailabilityState = Literal[
    "available",
    "missing_model_files",
    "partially_installed",
    "unsupported",
    "experimental",
    "hidden",
]


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
    reference_images: bool = False
    control_image: bool = False
    inpainting: bool = False
    lora: LoraSupport = "future"
    default_aspect_ratio: AspectRatio = "1:1"
    default_resolution_tier: ResolutionTier = "720p"
    allowed_aspect_ratios: tuple[AspectRatio, ...] = ("1:1", "16:9", "9:16")
    allowed_resolution_tiers: tuple[ResolutionTier, ...] = (
        "540p",
        "720p",
        "1080p",
    )
    min_resolution_tier: ResolutionTier | None = None
    max_resolution_tier: ResolutionTier | None = None
    wangp_resolution_categories: tuple[str, ...] = ()


# Curated image model profiles. Add new image models here — the frontend
# reads this list via GET /api/model-profiles and renders the dropdowns
# from it. Do not auto-expose every WanGP-supported model.
IMAGE_PROFILES: tuple[ModelProfile, ...] = (
    ModelProfile(
        id="z_image_turbo",
        display_name="Z-Image Turbo",
        media_type="image",
        visible=True,
        status="stable",
        wangp_model_type="z_image",
        wangp_metadata=WanGPModelMetadata(
            family="z_image",
            family_label="Z-Image",
            base_model_type="z_image",
            finetune=False,
            main_output=("image",),
            outputs=("image",),
            inputs=("text",),
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
                "audio": {"prompt": False, "output": False},
            },
            capabilities={
                "text_to_video": False,
                "image_to_video": False,
                "video_to_video": False,
                "text_to_image": True,
                "image_to_image": False,
                "text_to_audio": False,
                "audio_to_audio": False,
                "audio_to_video": False,
                "audio_output": False,
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
                "image_prompt_type": {
                    "allowed": "",
                    "choices": [{"label": "Text/new generation", "value": ""}],
                },
                "video_prompt_type": {
                    "guide_preprocessing": None,
                    "mask_preprocessing": None,
                    "guide_custom_choices": None,
                    "image_ref_choices": None,
                    "custom_video_selection": None,
                    "forced": "",
                },
                "audio_prompt_type": {"sources": None, "custom_option": None},
                "model_mode": None,
                "sample_solver": None,
                "prompt_enhancer": None,
            },
        ),
        text_to_image=True,
        reference_images=False,
        control_image=False,
        inpainting=False,
        lora="future",
        default_aspect_ratio="1:1",
        default_resolution_tier="720p",
        allowed_aspect_ratios=("1:1", "16:9", "9:16"),
        allowed_resolution_tiers=("540p", "720p", "1080p"),
    ),
    ModelProfile(
        id="krea2_turbo",
        display_name="Krea 2 Turbo",
        media_type="image",
        visible=True,
        status="experimental",
        wangp_model_type="krea2_turbo",
        wangp_metadata=WanGPModelMetadata(
            family="krea2",
            family_label="Krea 2",
            base_model_type="krea2_turbo",
            finetune=False,
            main_output=("image",),
            outputs=("image",),
            inputs=("text", "image"),
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
                    "mask": True,
                },
                "video": {
                    "continue": False,
                    "last": False,
                    "control": False,
                    "mask": False,
                },
                "audio": {"prompt": False, "output": False},
            },
            capabilities={
                "text_to_video": False,
                "image_to_video": False,
                "video_to_video": False,
                "text_to_image": True,
                "image_to_image": False,
                "text_to_audio": False,
                "audio_to_audio": False,
                "audio_to_video": False,
                "audio_output": False,
                "inpainting": True,
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
                "image_prompt_type": {
                    "allowed": "",
                    "choices": [{"label": "Text/new generation", "value": ""}],
                },
                "video_prompt_type": {
                    "guide_preprocessing": None,
                    "mask_preprocessing": None,
                    "guide_custom_choices": None,
                    "image_ref_choices": None,
                    "custom_video_selection": None,
                    "forced": "",
                },
                "audio_prompt_type": {"sources": None, "custom_option": None},
                "model_mode": {
                    "default": 2,
                    "label": "Inpainting Method",
                    "choices": [
                        {
                            "label": "LanPaint (2 steps): ~2x slower, easy task",
                            "value": "2",
                        },
                        {
                            "label": "LanPaint (5 steps): ~5x slower, medium task",
                            "value": "3",
                        },
                        {
                            "label": "LanPaint (10 steps): ~10x slower, hard task",
                            "value": "4",
                        },
                        {
                            "label": "LanPaint (15 steps): ~15x slower, very hard task",
                            "value": "5",
                        },
                    ],
                },
                "sample_solver": None,
                "prompt_enhancer": None,
            },
        ),
        wangp_default_settings={
            "image_mode": 1,
            "num_inference_steps": 8,
            "guidance_scale": 0,
        },
        text_to_image=True,
        reference_images=False,
        control_image=False,
        inpainting=False,
        lora="future",
        default_aspect_ratio="1:1",
        default_resolution_tier="720p",
        allowed_aspect_ratios=("1:1", "16:9", "9:16"),
        allowed_resolution_tiers=("540p", "720p", "1080p", "1440p"),
        min_resolution_tier="540p",
        max_resolution_tier="1440p",
        wangp_resolution_categories=("<=2k",),
    ),
    ModelProfile(
        id="flux2_klein_4b",
        display_name="Flux 2 Klein 4B",
        media_type="image",
        visible=True,
        status="experimental",
        wangp_model_type="flux2_klein_4b",
        wangp_metadata=WanGPModelMetadata(
            family="flux2",
            family_label="Flux 2",
            base_model_type="flux2_klein_4b",
            finetune=False,
            main_output=("image",),
            outputs=("image",),
            inputs=("text", "image"),
            media_inputs={
                "image": {
                    "start": False,
                    "end": False,
                    "reference": True,
                    "single_reference": False,
                    "multiple_references": True,
                    "background": True,
                    "injected_frames": False,
                    "control": True,
                    "mask": True,
                },
                "video": {
                    "continue": False,
                    "last": False,
                    "control": False,
                    "mask": False,
                },
                "audio": {"prompt": False, "output": False},
            },
            capabilities={
                "text_to_video": False,
                "image_to_video": False,
                "video_to_video": False,
                "text_to_image": True,
                "image_to_image": True,
                "text_to_audio": False,
                "audio_to_audio": False,
                "audio_to_video": False,
                "audio_output": False,
                "inpainting": True,
                "outpainting": True,
                "reference_images": True,
                "background_image": True,
                "injected_frames": False,
                "control_image": True,
                "control_video": False,
                "video_continuation": False,
                "sliding_window": False,
                "lora": True,
            },
            setting_values={
                "image_prompt_type": {
                    "allowed": "",
                    "choices": [{"label": "Text/new generation", "value": ""}],
                },
                "video_prompt_type": {
                    "guide_preprocessing": {
                        "choices": [
                            {"label": "None", "value": ""},
                            {"label": "PV", "value": "PV"},
                            {"label": "MV", "value": "MV"},
                        ],
                    },
                    "mask_preprocessing": {
                        "visible": True,
                        "choices": [
                            {"label": "None", "value": ""},
                            {"label": "A", "value": "A"},
                            {"label": "NA", "value": "NA"},
                        ],
                    },
                    "guide_custom_choices": None,
                    "image_ref_choices": {
                        "letters_filter": "KI",
                        "choices": [
                            {"label": "None", "value": ""},
                            {
                                "label": (
                                    "Conditional Image is first Main Subject / "
                                    "Landscape and may be followed by People / "
                                    "Objects"
                                ),
                                "value": "KI",
                            },
                            {
                                "label": "Conditional Images are People / Objects",
                                "value": "I",
                            },
                        ],
                    },
                    "custom_video_selection": None,
                    "forced": "",
                },
                "audio_prompt_type": {"sources": None, "custom_option": None},
                "model_mode": {
                    "default": 0,
                    "label": "Inpainting Method",
                    "choices": [
                        {
                            "label": (
                                "Masked Denoising : Inpainted area may reuse "
                                "some content that has been masked"
                            ),
                            "value": "",
                        },
                        {
                            "label": "LanPaint (2 steps): ~2x slower, easy task",
                            "value": "2",
                        },
                        {
                            "label": "LanPaint (5 steps): ~5x slower, medium task",
                            "value": "3",
                        },
                        {
                            "label": "LanPaint (10 steps): ~10x slower, hard task",
                            "value": "4",
                        },
                        {
                            "label": "LanPaint (15 steps): ~15x slower, very hard task",
                            "value": "5",
                        },
                    ],
                },
                "sample_solver": None,
                "prompt_enhancer": None,
            },
        ),
        text_to_image=True,
        reference_images=False,
        control_image=False,
        inpainting=False,
        lora="future",
        default_aspect_ratio="1:1",
        default_resolution_tier="720p",
        allowed_aspect_ratios=("1:1", "16:9", "9:16"),
        allowed_resolution_tiers=("540p", "720p", "1080p", "1440p"),
        min_resolution_tier="540p",
        max_resolution_tier="1440p",
    ),
    ModelProfile(
        id="hidream_o1_dev",
        display_name="HiDream O1",
        media_type="image",
        visible=True,
        status="experimental",
        wangp_model_type="hidream_o1_dev",
        wangp_metadata=WanGPModelMetadata(
            family="hidream",
            family_label="HiDream",
            base_model_type="hidream_o1_dev",
            finetune=False,
            main_output=("image",),
            outputs=("image",),
            inputs=("text", "image"),
            media_inputs={
                "image": {
                    "start": False,
                    "end": False,
                    "reference": True,
                    "single_reference": False,
                    "multiple_references": True,
                    "background": True,
                    "injected_frames": False,
                    "control": True,
                    "mask": False,
                },
                "video": {
                    "continue": False,
                    "last": False,
                    "control": False,
                    "mask": False,
                },
                "audio": {"prompt": False, "output": False},
            },
            capabilities={
                "text_to_video": False,
                "image_to_video": False,
                "video_to_video": False,
                "text_to_image": True,
                "image_to_image": True,
                "text_to_audio": False,
                "audio_to_audio": False,
                "audio_to_video": False,
                "audio_output": False,
                "inpainting": False,
                "outpainting": False,
                "reference_images": True,
                "background_image": True,
                "injected_frames": False,
                "control_image": True,
                "control_video": False,
                "video_continuation": False,
                "sliding_window": False,
                "lora": True,
            },
            setting_values={
                "image_prompt_type": {
                    "allowed": "",
                    "choices": [{"label": "Text/new generation", "value": ""}],
                },
                "video_prompt_type": {
                    "guide_preprocessing": {
                        "choices": [
                            {"label": "Use Control Image Unchanged", "value": ""},
                            {"label": "Use Control Image Unchanged", "value": "V"},
                            {"label": "PV", "value": "PV"},
                            {"label": "DV", "value": "DV"},
                            {"label": "EV", "value": "EV"},
                        ],
                    },
                    "mask_preprocessing": None,
                    "guide_custom_choices": None,
                    "image_ref_choices": {
                        "default": "",
                        "letters_filter": "KI",
                        "choices": [
                            {"label": "None", "value": ""},
                            {
                                "label": (
                                    "Conditional Image is first Main Subject / "
                                    "Landscape and may be followed by People / "
                                    "Objects"
                                ),
                                "value": "KI",
                            },
                            {
                                "label": "Conditional Images are References",
                                "value": "I",
                            },
                        ],
                    },
                    "custom_video_selection": None,
                    "forced": "",
                },
                "audio_prompt_type": {"sources": None, "custom_option": None},
                "model_mode": None,
                "sample_solver": {
                    "choices": [{"label": "Flash", "value": "flash"}],
                },
                "prompt_enhancer": None,
            },
        ),
        text_to_image=True,
        reference_images=False,
        control_image=False,
        inpainting=False,
        lora="future",
        default_aspect_ratio="1:1",
        default_resolution_tier="720p",
        allowed_aspect_ratios=("1:1", "16:9", "9:16"),
        allowed_resolution_tiers=("540p", "720p", "1080p", "1440p"),
        min_resolution_tier="540p",
        max_resolution_tier="1440p",
    ),
)


def get_image_profile(profile_id: str) -> ModelProfile | None:
    """Return the image profile with the given id, or None if not curated."""
    for profile in IMAGE_PROFILES:
        if profile.id == profile_id:
            return profile
    return None


def get_visible_image_profiles() -> list[ModelProfile]:
    """Return visible image profiles in display order."""
    return [profile for profile in IMAGE_PROFILES if profile.visible]
