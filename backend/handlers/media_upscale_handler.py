"""Curated WanGP Media Flow upscale orchestration."""

from __future__ import annotations

import uuid
from threading import RLock

from _routes._errors import HTTPError
from api_types import (
    MediaUpscaleCatalogResponse,
    MediaUpscaleMethod,
    MediaUpscaleRequest,
    MediaUpscaleResponse,
)
from handlers.base import StateHandlerBase
from handlers.generation_handler import GenerationHandler
from server_utils.media_validation import validate_image_file, validate_video_file
from services.wangp_bridge import WanGPBridge
from state.app_state_types import AppState


_METHODS = (
    MediaUpscaleMethod(
        id="lanczos", label="Lanczos", mediaKinds=["image", "video"],
        scales=[2, 2.5, 3, 3.5, 4],
    ),
    MediaUpscaleMethod(
        id="flashvsr", label="FlashVSR", mediaKinds=["image", "video"],
        scales=[2, 2.5, 3, 3.5, 4],
    ),
    MediaUpscaleMethod(
        id="flashvsr2pass", label="FlashVSR 2-pass", mediaKinds=["image", "video"],
        scales=[2, 2.5, 3, 3.5, 4],
    ),
    MediaUpscaleMethod(
        id="seedvr2", label="SeedVR2", mediaKinds=["image", "video"],
        scales=[2, 2.5, 3, 3.5, 4],
    ),
    MediaUpscaleMethod(
        id="ltx25", label="LTX 2.5 Pixel Upscale", mediaKinds=["video"], scales=[2],
    ),
)
_METHOD_BY_ID = {method.id: method for method in _METHODS}


class MediaUpscaleHandler(StateHandlerBase):
    def __init__(self, state: AppState, lock: RLock, generation_handler: GenerationHandler, wangp_bridge: WanGPBridge) -> None:
        super().__init__(state, lock)
        self._generation = generation_handler
        self._wangp_bridge = wangp_bridge

    def catalog(self) -> MediaUpscaleCatalogResponse:
        return MediaUpscaleCatalogResponse(methods=list(_METHODS))

    def upscale(self, req: MediaUpscaleRequest) -> MediaUpscaleResponse:
        if not self._wangp_bridge.get_status().available:
            raise HTTPError(503, "WANGP_UNAVAILABLE: WanGP is not available.")
        method = _METHOD_BY_ID[req.method]
        if req.mediaKind not in method.mediaKinds or req.scale not in method.scales:
            raise HTTPError(400, "UPSCALE_METHOD_UNSUPPORTED: Method and scale are not supported for this media.")
        source = validate_image_file(req.sourcePath) if req.mediaKind == "image" else validate_video_file(req.sourcePath)
        try:
            self._generation.start_generation_job(f"upscale-{uuid.uuid4().hex[:8]}")
        except RuntimeError as exc:
            raise HTTPError(409, "Generation already in progress") from exc
        try:
            output = self._wangp_bridge.upscale_media(
                source_path=str(source.resolve()),
                spatial_upsampler=f"{req.method}{req.scale:g}",
                media_kind=req.mediaKind,
                on_progress=self._generation.update_progress,
                is_cancelled=self._generation.is_generation_cancelled,
            )
            if self._generation.is_generation_cancelled():
                return MediaUpscaleResponse(status="cancelled")
            self._generation.complete_generation(output)
            return MediaUpscaleResponse(status="complete", media_path=output)
        except Exception as exc:
            if self._generation.is_generation_cancelled():
                return MediaUpscaleResponse(status="cancelled")
            self._generation.fail_generation(str(exc))
            raise HTTPError(500, f"UPSCALE_FAILED: {exc}") from exc
