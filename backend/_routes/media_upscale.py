"""Routes for curated WanGP Media Flow upscaling."""

from fastapi import APIRouter, Depends

from api_types import MediaUpscaleCatalogResponse, MediaUpscaleRequest, MediaUpscaleResponse
from app_handler import AppHandler
from state import get_state_service

router = APIRouter(prefix="/api/media-upscale", tags=["media-upscale"])


@router.get("/catalog", response_model=MediaUpscaleCatalogResponse)
def route_catalog(handler: AppHandler = Depends(get_state_service)) -> MediaUpscaleCatalogResponse:
    return handler.media_upscale.catalog()


@router.post("", response_model=MediaUpscaleResponse)
def route_upscale(req: MediaUpscaleRequest, handler: AppHandler = Depends(get_state_service)) -> MediaUpscaleResponse:
    return handler.media_upscale.upscale(req)
