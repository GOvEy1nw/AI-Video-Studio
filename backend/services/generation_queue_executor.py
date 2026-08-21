"""The only dispatcher from persisted queue jobs into domain handlers."""

from __future__ import annotations

from typing import Any

from _routes._errors import HTTPError
from api_types import (
    GenerateDirectorRequest, GenerateImageRequest, GenerateMusicRequest,
    GenerateSfxRequest, GenerateSpeechRequest, GenerateVideoRequest,
    MediaUpscaleRequest, RetakeRequest,
)
from state.generation_queue_types import GenerationQueueJob


class GenerationJobExecutor:
    def __init__(self, handler: Any) -> None:
        self._handler = handler

    def execute(self, job: GenerationQueueJob) -> dict[str, Any]:
        payload = job.payload
        generation = self._handler.generation
        with generation.bind_queue_job(job.id, self._handler.generation_queue):
            match job.kind:
                case "image.generate":
                    response = self._handler.image_generation.generate(GenerateImageRequest.model_validate(payload))
                case "video.generate":
                    response = self._handler.video_generation.generate(GenerateVideoRequest.model_validate(payload))
                case "audio.music":
                    response = self._handler.music_generation.generate(GenerateMusicRequest.model_validate(payload))
                case "audio.sfx":
                    response = self._handler.sfx_generation.generate(GenerateSfxRequest.model_validate(payload))
                case "audio.speech":
                    response = self._handler.speech_generation.generate(GenerateSpeechRequest.model_validate(payload))
                case "media.upscale":
                    response = self._handler.media_upscale.upscale(MediaUpscaleRequest.model_validate(payload))
                case "video.retake":
                    response = self._handler.retake.run(RetakeRequest.model_validate(payload))
                case "director.generate":
                    response = self._handler.director_generation.generate(GenerateDirectorRequest.model_validate(payload))
                case _:
                    raise HTTPError(400, f"UNSUPPORTED_JOB_KIND: {job.kind}")
        return {"kind": job.kind, "response": response.model_dump(mode="json")}
