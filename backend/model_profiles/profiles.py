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
