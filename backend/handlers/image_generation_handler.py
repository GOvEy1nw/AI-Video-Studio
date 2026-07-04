"""Image generation orchestration handler."""

from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime
from pathlib import Path
from threading import RLock
from typing import TYPE_CHECKING

from _routes._errors import HTTPError
from api_types import GenerateImageRequest, GenerateImageResponse
from handlers.base import StateHandlerBase
from handlers.generation_handler import GenerationHandler
from handlers.pipelines_handler import PipelinesHandler
from model_profiles import get_image_profile, is_combination_supported, resolve_resolution
from model_profiles.profiles import ModelProfile
from services.interfaces import ZitAPIClient
from services.wangp_bridge import WanGPBridge
from state.app_state_types import AppState

if TYPE_CHECKING:
    from runtime_config.runtime_config import RuntimeConfig

logger = logging.getLogger(__name__)


class ImageGenerationHandler(StateHandlerBase):
    def __init__(
        self,
        state: AppState,
        lock: RLock,
        generation_handler: GenerationHandler,
        pipelines_handler: PipelinesHandler,
        outputs_dir: Path,
        config: RuntimeConfig,
        zit_api_client: ZitAPIClient,
        wangp_bridge: WanGPBridge,
    ) -> None:
        super().__init__(state, lock)
        self._generation = generation_handler
        self._pipelines = pipelines_handler
        self._outputs_dir = outputs_dir
        self._config = config
        self._zit_api_client = zit_api_client
        self._wangp_bridge = wangp_bridge

    def generate(self, req: GenerateImageRequest) -> GenerateImageResponse:
        if self._config.wangp_enabled:
            return self._generate_via_wangp(req)

        raise HTTPError(503, "WANGP_REQUIRED: Image generation is only available via WanGP.")

    def _generate_via_wangp(self, req: GenerateImageRequest) -> GenerateImageResponse:
        if self._generation.is_generation_running():
            raise HTTPError(409, "Generation already in progress")

        profile, width, height = self._resolve_profile_and_dimensions(req)
        num_images = max(1, min(12, req.numImages))

        generation_id = uuid.uuid4().hex[:8]
        settings = self.state.app_settings.model_copy(deep=True)
        seed = settings.locked_seed if settings.seed_locked else int(time.time()) % 2147483647

        # Profile-driven WanGP settings: model_type + model defaults,
        # merged with the request's explicit num_steps and the resolved
        # exact WxH. The frontend never sends a vague value like '1080p'
        # — the backend resolves it to e.g. '1920x1088'.
        wangp_model_type = profile.wangp_model_type if profile is not None else self._config.wangp_image_model_type
        wangp_default_settings = dict(profile.wangp_default_settings) if profile is not None else {}
        num_steps = self._resolve_num_steps(req, wangp_default_settings, wangp_model_type)

        try:
            self._generation.start_api_generation(generation_id)
            output_paths = self._wangp_bridge.generate_images(
                prompt=req.prompt,
                width=width,
                height=height,
                num_steps=num_steps,
                num_images=num_images,
                seed=seed,
                on_progress=self._generation.update_progress,
                is_cancelled=self._generation.is_generation_cancelled,
                model_type=wangp_model_type,
                default_settings=wangp_default_settings,
            )
            self._generation.complete_generation(output_paths)
            return GenerateImageResponse(status="complete", image_paths=output_paths)
        except HTTPError as e:
            # Propagate intentional client-error responses unchanged.
            self._generation.fail_generation(e.detail)
            raise
        except Exception as e:
            self._generation.fail_generation(str(e))
            if "cancelled" in str(e).lower():
                logger.info("WanGP image generation cancelled by user")
                return GenerateImageResponse(status="cancelled")
            raise HTTPError(500, str(e)) from e

    def _resolve_profile_and_dimensions(
        self, req: GenerateImageRequest
    ) -> tuple[ModelProfile | None, int, int]:
        """Resolve a GenerateImageRequest into (profile, width, height).

        When ``modelProfileId`` is set, the curated profile is the source
        of truth: the request's tier/aspect are validated against the
        profile's allowed lists and the exact WxH is resolved from the
        curated table. Raw ``width``/``height`` are still accepted when no
        profile is supplied, for backwards compatibility — but arbitrary
        frontend-provided WanGP model types cannot bypass the curated
        profile layer because the model_type is always derived from a
        profile id (or the server's configured default).
        """
        if req.modelProfileId is None:
            width = (req.width // 16) * 16
            height = (req.height // 16) * 16
            return None, width, height

        profile = get_image_profile(req.modelProfileId)
        if profile is None:
            raise HTTPError(400, f"UNKNOWN_MODEL_PROFILE: {req.modelProfileId}")
        if not profile.visible:
            raise HTTPError(400, f"MODEL_PROFILE_HIDDEN: {req.modelProfileId}")

        tier = req.resolutionTier or profile.default_resolution_tier
        aspect = req.aspectRatio or profile.default_aspect_ratio

        if tier not in profile.allowed_resolution_tiers:
            raise HTTPError(
                400,
                f"UNSUPPORTED_RESOLUTION_TIER: {tier} for {profile.display_name}",
            )
        if aspect not in profile.allowed_aspect_ratios:
            raise HTTPError(
                400,
                f"UNSUPPORTED_ASPECT_RATIO: {aspect} for {profile.display_name}",
            )
        if not is_combination_supported(profile, tier, aspect):
            # No curated exact WxH for this combination — do not invent one.
            raise HTTPError(
                400,
                f"NO_CURATED_RESOLUTION: {profile.display_name} {tier} {aspect}",
            )

        width, height = resolve_resolution(profile, tier, aspect)
        return profile, width, height

    @staticmethod
    def _resolve_num_steps(
        req: GenerateImageRequest,
        wangp_default_settings: dict[str, object],
        wangp_model_type: str,
    ) -> int:
        """Pick the inference step count for the WanGP call.

        Profile default settings take precedence (e.g. Krea 2 Turbo pins
        num_inference_steps=8), then the request's explicit numSteps,
        then the z_image 8-step floor inherited from the Phase 3 bridge.
        """
        default_steps = wangp_default_settings.get("num_inference_steps")
        if isinstance(default_steps, int):
            return max(1, default_steps)
        steps = max(1, req.numSteps)
        if wangp_model_type.startswith("z_image"):
            return max(8, steps)
        return steps

    def generate_image(
        self,
        prompt: str,
        width: int,
        height: int,
        num_inference_steps: int,
        seed: int | None,
        num_images: int,
    ) -> list[str]:
        if self._generation.is_generation_cancelled():
            raise RuntimeError("Generation was cancelled")

        self._generation.update_progress("loading_model", 5, 0, num_inference_steps)
        zit = self._pipelines.load_zit_to_gpu()
        self._generation.update_progress("inference", 15, 0, num_inference_steps)

        if seed is None:
            seed = int(time.time()) % 2147483647

        outputs: list[str] = []
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        for i in range(num_images):
            if self._generation.is_generation_cancelled():
                raise RuntimeError("Generation was cancelled")

            progress = 15 + int((i / num_images) * 80)
            self._generation.update_progress("inference", progress, i, num_images)

            result = zit.generate(
                prompt=prompt,
                height=height,
                width=width,
                guidance_scale=0.0,
                num_inference_steps=num_inference_steps,
                seed=seed + i,
            )

            output_path = self._outputs_dir / f"zit_image_{timestamp}_{uuid.uuid4().hex[:8]}.png"
            result.images[0].save(str(output_path))
            outputs.append(str(output_path))

        if self._generation.is_generation_cancelled():
            raise RuntimeError("Generation was cancelled")

        self._generation.update_progress("complete", 100, num_images, num_images)
        return outputs

    def _generate_via_api(
        self,
        *,
        prompt: str,
        width: int,
        height: int,
        num_inference_steps: int,
        seed: int,
        num_images: int,
    ) -> GenerateImageResponse:
        generation_id = uuid.uuid4().hex[:8]
        output_paths: list[Path] = []
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        settings = self.state.app_settings.model_copy(deep=True)

        try:
            self._generation.start_api_generation(generation_id)
            self._generation.update_progress("validating_request", 5, None, None)

            if not settings.fal_api_key.strip():
                raise HTTPError(500, "FAL_API_KEY_NOT_CONFIGURED")

            for idx in range(num_images):
                if self._generation.is_generation_cancelled():
                    raise RuntimeError("Generation was cancelled")

                inference_progress = 15 + int((idx / num_images) * 60)
                self._generation.update_progress("inference", inference_progress, None, None)
                image_bytes = self._zit_api_client.generate_text_to_image(
                    api_key=settings.fal_api_key,
                    prompt=prompt,
                    width=width,
                    height=height,
                    seed=seed + idx,
                    num_inference_steps=num_inference_steps,
                )

                if self._generation.is_generation_cancelled():
                    raise RuntimeError("Generation was cancelled")

                download_progress = 75 + int(((idx + 1) / num_images) * 20)
                self._generation.update_progress("downloading_output", download_progress, None, None)

                output_path = self._outputs_dir / f"zit_api_image_{timestamp}_{uuid.uuid4().hex[:8]}.png"
                output_path.write_bytes(image_bytes)
                output_paths.append(output_path)

            self._generation.update_progress("complete", 100, None, None)
            self._generation.complete_generation([str(path) for path in output_paths])
            return GenerateImageResponse(status="complete", image_paths=[str(path) for path in output_paths])
        except HTTPError as e:
            self._generation.fail_generation(e.detail)
            raise
        except Exception as e:
            self._generation.fail_generation(str(e))
            if "cancelled" in str(e).lower():
                for path in output_paths:
                    path.unlink(missing_ok=True)
                logger.info("Image generation cancelled by user")
                return GenerateImageResponse(status="cancelled")
            raise HTTPError(500, str(e)) from e
