"""WanGP-backed Retake request adapter."""

from __future__ import annotations

from api_types import GenerateVideoInputMedia, GenerateVideoRequest, RetakeRequest, RetakeResponse
from handlers.video_generation_handler import VideoGenerationHandler


class RetakeHandler:
    def __init__(self, video_generation: VideoGenerationHandler) -> None:
        self._video_generation = video_generation

    def run(self, req: RetakeRequest) -> RetakeResponse:
        """Generate a replacement clip through the normal WanGP video path.

        WanGP does not expose the inherited LTX Retake API. A trimmed control
        video gives the supported equivalent: regenerate this segment from its
        visual/motion guide and the user's prompt.
        """
        prompt = req.prompt.strip() or "Continue this video naturally"
        generated = self._video_generation.generate(
            GenerateVideoRequest(
                prompt=prompt,
                duration=str(max(2, round(req.duration))),
                audio="true" if req.mode != "replace_video" else "false",
                inputMedia=[
                    GenerateVideoInputMedia(
                        type="video",
                        path=req.video_path,
                        role="control_video",
                        trimStartTime=req.start_time,
                        trimDuration=req.duration,
                    )
                ],
            )
        )
        return RetakeResponse(status=generated.status, video_path=generated.video_path)
