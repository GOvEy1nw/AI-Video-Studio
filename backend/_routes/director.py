"""Thin Director Mode generation route."""

from fastapi import APIRouter, Depends

from api_types import GenerateDirectorRequest, GenerateDirectorResponse
from app_handler import AppHandler
from state import get_state_service

router = APIRouter(prefix="/api/director", tags=["director"])


@router.post("/generate", response_model=GenerateDirectorResponse)
def route_generate_director(
    request: GenerateDirectorRequest,
    handler: AppHandler = Depends(get_state_service),
) -> GenerateDirectorResponse:
    return handler.director_generation.generate(request)
