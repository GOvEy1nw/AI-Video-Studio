"""Handler exposing curated model profiles to the frontend.

Reads from the static ``model_profiles`` registry and augments each
profile with an availability state derived from the WanGP bridge status.
The frontend consumes this list to drive the image-mode model selector
and per-model resolution/aspect dropdowns.
"""

from __future__ import annotations

from threading import RLock
from typing import TYPE_CHECKING

from api_types import (
    ModelProfileCapabilities,
    ModelProfileInputMedia,
    ModelProfileInputMediaRole,
    ModelProfileListResponse,
    ModelProfileResponse,
    ModelProfileUi,
    ModelProfileWanGPMetadata,
)
from handlers.base import StateHandlerBase
from model_profiles import get_visible_image_profiles, get_visible_video_profiles
from model_profiles.profiles import ModelProfile
from services.wangp_bridge import WanGPBridge
from state.app_state_types import AppState

if TYPE_CHECKING:
    from runtime_config.runtime_config import RuntimeConfig


class ModelProfilesHandler(StateHandlerBase):
    def __init__(
        self,
        state: AppState,
        lock: RLock,
        config: RuntimeConfig,
        wangp_bridge: WanGPBridge,
    ) -> None:
        super().__init__(state, lock)
        self._config = config
        self._wangp_bridge = wangp_bridge

    def list_profiles(self) -> ModelProfileListResponse:
        bridge_available = self._wangp_bridge.get_status().available
        responses: list[ModelProfileResponse] = []
        for profile in [*get_visible_image_profiles(), *get_visible_video_profiles()]:
            responses.append(self._to_response(profile, bridge_available))
        return ModelProfileListResponse(profiles=responses)

    def _to_response(
        self, profile: ModelProfile, bridge_available: bool
    ) -> ModelProfileResponse:
        availability = self._derive_availability(profile, bridge_available)
        metadata = profile.wangp_metadata
        return ModelProfileResponse(
            id=profile.id,
            displayName=profile.display_name,
            mediaType=profile.media_type,
            visible=profile.visible,
            status=profile.status,
            wangpModelType=profile.wangp_model_type,
            wangpMetadata=ModelProfileWanGPMetadata(
                modelType=profile.wangp_model_type,
                family=metadata.family,
                familyLabel=metadata.family_label,
                baseModelType=metadata.base_model_type,
                finetune=metadata.finetune,
                mainOutput=list(metadata.main_output),
                outputs=list(metadata.outputs),
                inputs=list(metadata.inputs),
                mediaInputs=metadata.media_inputs,
                capabilities=metadata.capabilities,
                settingValues=metadata.setting_values,
            ),
            capabilities=ModelProfileCapabilities(
                textToImage=profile.text_to_image,
                textToVideo=profile.text_to_video,
                imageToVideo=profile.image_to_video,
                videoToVideo=profile.video_to_video,
                audioToVideo=profile.audio_to_video,
                audioOutput=profile.audio_output,
                startImage=profile.start_image,
                endImage=profile.end_image,
                controlVideo=profile.control_video,
                videoContinuation=profile.video_continuation,
                slidingWindow=profile.sliding_window,
                referenceImages=profile.reference_images,
                controlImage=profile.control_image,
                inpainting=profile.inpainting,
                lora=profile.lora,
            ),
            ui=ModelProfileUi(
                defaultAspectRatio=profile.default_aspect_ratio,
                defaultResolutionTier=profile.default_resolution_tier,
                allowedAspectRatios=list(profile.allowed_aspect_ratios),
                allowedResolutionTiers=list(profile.allowed_resolution_tiers),
            ),
            inputMedia=ModelProfileInputMedia(
                supportsImageInputs=profile.input_media.supports_image_inputs,
                tooltipLabel=profile.input_media.tooltip_label,
                maxImages=profile.input_media.max_images,
                defaultRole=profile.input_media.default_role,
                roles=[
                    ModelProfileInputMediaRole(
                        role=role.role,
                        label=role.label,
                        description=role.description,
                        kind=role.kind,
                    )
                    for role in profile.input_media.roles
                ],
            ),
            availability=availability,
        )

    @staticmethod
    def _derive_availability(profile: ModelProfile, bridge_available: bool) -> str:
        if profile.status == "experimental":
            # Experimental models are still selectable; the UI marks them
            # experimental but they may be available if WanGP is up.
            return "experimental" if bridge_available else "missing_model_files"
        if not bridge_available:
            return "missing_model_files"
        return "available"
