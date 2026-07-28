"""Route handler for curated text-to-music generation."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from api_types import (
    ComposeMusicLyricsRequest,
    ComposeMusicLyricsResponse,
    GenerateMusicRequest,
    GenerateMusicResponse,
)
from app_handler import AppHandler
from state import get_state_service

router = APIRouter(prefix="/api", tags=["music"])


@router.post("/generate-music", response_model=GenerateMusicResponse)
def route_generate_music(
    req: GenerateMusicRequest,
    handler: AppHandler = Depends(get_state_service),
) -> GenerateMusicResponse:
    return handler.music_generation.generate(req)


@router.post("/music/compose-lyrics", response_model=ComposeMusicLyricsResponse)
def route_compose_music_lyrics(
    req: ComposeMusicLyricsRequest,
    handler: AppHandler = Depends(get_state_service),
) -> ComposeMusicLyricsResponse:
    return handler.music_generation.compose_lyrics(req)
