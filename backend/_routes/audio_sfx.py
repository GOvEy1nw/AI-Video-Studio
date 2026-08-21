"""Route for curated MMAudio sound-effect generation."""

from fastapi import APIRouter, Depends

from api_types import GenerateSfxRequest, GenerateSfxResponse
from app_handler import AppHandler
from state import get_state_service

router = APIRouter(prefix="/api", tags=["audio"])


@router.post("/generate-sfx", response_model=GenerateSfxResponse)
def route_generate_sfx(req: GenerateSfxRequest, handler: AppHandler = Depends(get_state_service)) -> GenerateSfxResponse:
    return handler.generation_queue.run_legacy("audio.sfx", req, GenerateSfxResponse)
