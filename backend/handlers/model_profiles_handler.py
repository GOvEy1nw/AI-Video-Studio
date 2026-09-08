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
    ModelProfileDirectorRenderStrategyPolicy,
    ModelProfileDirectorPolicy,
    ModelProfileInputMedia,
    ModelProfileInputMediaRole,
    ModelProfileLicenseInfo,
    ModelProfileListResponse,
    ModelProfileResponse,
    ModelProfileStyle,
    ModelProfileSfxPolicy,
    ModelProfileSpeechPolicy,
    ModelProfileSystemDependency,
    ModelProfileVideoAudioPolicy,
    ModelProfileVideoEditOperationPolicy,
    ModelProfileVideoEditPolicy,
    ModelProfileMusicPolicy,
    ModelProfilePromptComposerPolicy,
    ModelProfileUi,
    ModelProfileWanGPMetadata,
)
from handlers.base import StateHandlerBase
from model_profiles import (
    get_visible_image_profiles,
    get_visible_music_profiles,
    get_visible_sfx_profiles,
    get_visible_speech_profiles,
    get_visible_video_profiles,
)
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
        for profile in [
            *get_visible_image_profiles(),
            *get_visible_video_profiles(),
            *get_visible_music_profiles(),
            *get_visible_sfx_profiles(),
            *get_visible_speech_profiles(),
        ]:
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
            styles=[
                ModelProfileStyle(
                    id=style.id,
                    displayName=style.display_name,
                    thumbnailUrl=style.thumbnail_url,
                    sourceUrl=style.source_url,
                )
                for style in profile.styles
            ],
            capabilities=ModelProfileCapabilities(
                textToImage=profile.text_to_image,
                textToVideo=profile.text_to_video,
                imageToVideo=profile.image_to_video,
                videoToVideo=profile.video_to_video,
                audioToVideo=profile.audio_to_video,
                audioOutput=profile.audio_output,
                textToAudio=profile.text_to_audio,
                audioToAudio=profile.audio_to_audio,
                startImage=profile.start_image,
                endImage=profile.end_image,
                controlVideo=profile.control_video,
                videoContinuation=profile.video_continuation,
                slidingWindow=profile.sliding_window,
                referenceImages=profile.reference_images,
                controlImage=profile.control_image,
                inpainting=profile.inpainting,
                outpainting=profile.outpainting,
                maskedEditReferences=profile.masked_edit_references,
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
                maxReferenceImages=profile.input_media.max_reference_images,
                maxReferenceVideos=profile.input_media.max_reference_videos,
                maxReferenceAudios=profile.input_media.max_reference_audios,
                maxCombinedReferences=profile.input_media.max_combined_references,
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
            promptComposer=ModelProfilePromptComposerPolicy(
                promptFormat=profile.prompt_composer.prompt_format,
                entityMediaMode=profile.prompt_composer.entity_media_mode,
                voiceReference=profile.prompt_composer.voice_reference,
            ),
            requiredPackIds=list(profile.required_pack_ids),
            systemDependencies=[
                ModelProfileSystemDependency(
                    id=dependency.id,
                    kind=dependency.kind,
                    requiredBy=list(dependency.required_by),
                    userSelectable=dependency.user_selectable,
                )
                for dependency in profile.system_dependencies
            ],
            videoAudio=ModelProfileVideoAudioPolicy(
                status=profile.video_audio.status,
                handler=profile.video_audio.handler,
                requiredPackIds=list(profile.video_audio.required_pack_ids),
                soundtrack=profile.video_audio.soundtrack,
                audioConditioning=profile.video_audio.audio_conditioning,
                controlVideoAudio=profile.video_audio.control_video_audio,
                outputAudio=profile.video_audio.output_audio,
                maxAudioInputs=profile.video_audio.max_audio_inputs,
            ),
            speech=ModelProfileSpeechPolicy(
                status=profile.speech.status,
                handler=profile.speech.handler,
                requiredPackIds=list(profile.speech.required_pack_ids),
                referenceVoice=profile.speech.reference_voice,
                tts=profile.speech.tts,
                maxReferenceInputs=profile.speech.max_reference_inputs,
                referenceRequired=profile.speech.reference_required,
            ),
            sfx=ModelProfileSfxPolicy(
                status=profile.sfx.status,
                handler=profile.sfx.handler,
                requiredPackIds=list(profile.sfx.required_pack_ids),
                text=profile.sfx.text,
                controlVideoAudio=profile.sfx.control_video_audio,
                maxDurationSeconds=profile.sfx.max_duration_seconds,
            ),
            videoEdits=ModelProfileVideoEditPolicy(
                operations=[
                    ModelProfileVideoEditOperationPolicy(
                        id=operation.id,
                        status=operation.status,
                        handler=operation.handler,
                        requiredPackIds=list(operation.required_pack_ids),
                        systemDependencyIds=list(operation.system_dependency_ids),
                        sourceBehavior=operation.source_behavior,
                        durationBehavior=operation.duration_behavior,
                        disabledReason=operation.disabled_reason,
                    )
                    for operation in profile.video_edits.operations
                ]
            ),
            director=ModelProfileDirectorPolicy(
                enabled=profile.director.enabled,
                promptRelay=profile.director.prompt_relay,
                injectedFrames=profile.director.injected_frames,
                continueVideo=profile.director.continue_video,
                guideAudioStartOnly=profile.director.guide_audio_start_only,
                maxImageKeyframes=profile.director.max_image_keyframes,
                maxGuidanceSegments=profile.director.max_guidance_segments,
                guidanceModes=list(profile.director.guidance_modes),
                maxDurationSeconds=profile.director.max_duration_seconds,
                allowKeyframesWithVideoGuidance=profile.director.allow_keyframes_with_video_guidance,
                allowKeyframesWithIngredients=profile.director.allow_keyframes_with_ingredients,
                allowGuideAudioWithGuidance=profile.director.allow_guide_audio_with_guidance,
                renderStrategies=[
                    ModelProfileDirectorRenderStrategyPolicy(
                        id=strategy.id,
                        status=strategy.status,
                        handler=strategy.handler,
                        requiredPackIds=list(strategy.required_pack_ids),
                        maxDurationSeconds=strategy.max_duration_seconds,
                    )
                    for strategy in profile.director.render_strategies
                ],
            ),
            music=ModelProfileMusicPolicy(
                enabled=profile.music.enabled,
                supportsInstrumental=profile.music.supports_instrumental,
                supportsAutoLyrics=profile.music.supports_auto_lyrics,
                supportsCustomLyrics=profile.music.supports_custom_lyrics,
                autoLyricsRequiresPromptEnhancer=profile.music.auto_lyrics_requires_prompt_enhancer,
                autoFillMetadata=profile.music.auto_fill_metadata,
                durationMinSeconds=profile.music.duration_min_seconds,
                durationMaxSeconds=profile.music.duration_max_seconds,
                durationStepSeconds=profile.music.duration_step_seconds,
                defaultDurationSeconds=profile.music.default_duration_seconds,
                supportsBpm=profile.music.supports_bpm,
                bpmMin=profile.music.bpm_min,
                bpmMax=profile.music.bpm_max,
                supportsKeyScale=profile.music.supports_key_scale,
                supportsTimeSignature=profile.music.supports_time_signature,
                timeSignatures=list(profile.music.time_signatures),
                defaultVocalMode=profile.music.default_vocal_mode,
                maxVariations=profile.music.max_variations,
                supportsAutoDuration=profile.music.supports_auto_duration,
                autoDurationFallbackSeconds=profile.music.auto_duration_fallback_seconds,
                supportsDescriptionEnhancement=profile.music.supports_description_enhancement,
                supportsVocalLanguage=profile.music.supports_vocal_language,
                supportedLanguages=list(profile.music.supported_languages),
                defaultVocalLanguage=profile.music.default_vocal_language,
                supportsVocalGenderConditioning=profile.music.supports_vocal_gender_conditioning,
                supportsCover=profile.music.supports_cover,
                supportsReferenceTimbre=profile.music.supports_reference_timbre,
                supportsComposeLyrics=profile.music.supports_compose_lyrics,
                supportsComposeThinking=profile.music.supports_compose_thinking,
                defaultCoverStrength=profile.music.default_cover_strength,
                defaultWeirdness=profile.music.default_weirdness,
                defaultPromptInfluence=profile.music.default_prompt_influence,
            ),
            license=ModelProfileLicenseInfo(
                projectLicense=profile.license.project_license,
                weightsLicense=profile.license.weights_license,
                commercialUse=profile.license.commercial_use,
                attributionRequired=profile.license.attribution_required,
                sourceProject=profile.license.source_project,
                sourceRevision=profile.license.source_revision,
                licenseUrl=profile.license.license_url,
                notes=profile.license.notes,
            ) if profile.license is not None else None,
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
