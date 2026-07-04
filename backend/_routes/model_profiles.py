"""Route handler for GET /api/model-profiles."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from api_types import ModelProfileListResponse
from app_handler import AppHandler
from state import get_state_service

router = APIRouter(prefix="/api", tags=["model-profiles"])


@router.get("/model-profiles", response_model=ModelProfileListResponse)
def route_list_model_profiles(
    handler: AppHandler = Depends(get_state_service),
) -> ModelProfileListResponse:
    """GET /api/model-profiles — curated image/video model profiles."""
    return handler.model_profiles.list_profiles()
