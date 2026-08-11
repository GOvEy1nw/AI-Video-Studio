"""Route for curated single-speaker speech generation."""

from fastapi import APIRouter, Depends

from api_types import GenerateSpeechRequest, GenerateSpeechResponse
from app_handler import AppHandler
from state import get_state_service

router = APIRouter(prefix="/api", tags=["audio"])


@router.post("/generate-speech", response_model=GenerateSpeechResponse)
def route_generate_speech(req: GenerateSpeechRequest, handler: AppHandler = Depends(get_state_service)) -> GenerateSpeechResponse:
    return handler.speech_generation.generate(req)
