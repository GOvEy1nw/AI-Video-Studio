"""Curated model profile registry for AiVS."""

from model_profiles.profiles import (
    IMAGE_PROFILES,
    ModelProfile,
    get_image_profile,
    get_visible_image_profiles,
)
from model_profiles.resolution_resolver import (
    is_combination_supported,
    resolve_resolution,
)

__all__ = [
    "IMAGE_PROFILES",
    "ModelProfile",
    "get_image_profile",
    "get_visible_image_profiles",
    "is_combination_supported",
    "resolve_resolution",
]
