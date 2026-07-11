"""Generation state transitions shared by WanGP-backed routes."""

from __future__ import annotations

import logging

from api_types import CancelResponse, GenerationProgressResponse
from handlers.base import StateHandlerBase, with_state_lock
from state.app_state_types import (
    GenerationCancelled,
    GenerationComplete,
    GenerationError,
    GenerationProgress,
    GenerationRunning,
)

logger = logging.getLogger(__name__)


class GenerationHandler(StateHandlerBase):
    @with_state_lock
    def start_generation(self, generation_id: str) -> None:
        if self.is_generation_running():
            raise RuntimeError("Generation already in progress")
        self.state.generation = GenerationRunning(
            id=generation_id,
            progress=GenerationProgress(phase="", progress=0, current_step=None, total_steps=None),
        )

    start_generation_job = start_generation

    @with_state_lock
    def is_generation_cancelled(self) -> bool:
        return isinstance(self.state.generation, GenerationCancelled)

    @with_state_lock
    def update_progress(
        self,
        phase: str,
        progress: int,
        current_step: int | None = None,
        total_steps: int | None = None,
        phase_index: int | None = None,
        phase_count: int | None = None,
        section_index: int | None = None,
        section_count: int | None = None,
        status_detail: str | None = None,
        preview_url: str | None = None,
        download_current_file: str | None = None,
        download_current_file_progress: int | None = None,
        download_total_progress: int | None = None,
    ) -> None:
        if not isinstance(self.state.generation, GenerationRunning):
            return
        running = self.state.generation
        running.progress.phase = phase
        running.progress.progress = progress
        running.progress.current_step = current_step
        running.progress.total_steps = total_steps
        running.progress.phase_index = phase_index
        running.progress.phase_count = phase_count
        running.progress.section_index = section_index
        running.progress.section_count = section_count
        running.progress.status_detail = status_detail
        running.progress.preview_url = preview_url or running.progress.preview_url
        running.progress.download_current_file = download_current_file
        running.progress.download_current_file_progress = download_current_file_progress
        running.progress.download_total_progress = download_total_progress

    @with_state_lock
    def cancel_generation(self) -> CancelResponse:
        match self.state.generation:
            case GenerationRunning(id=generation_id):
                self.state.generation = GenerationCancelled(id=generation_id)
                return CancelResponse(status="cancelling", id=generation_id)
            case GenerationCancelled(id=generation_id):
                return CancelResponse(status="cancelling", id=generation_id)
            case _:
                return CancelResponse(status="no_active_generation")

    @with_state_lock
    def complete_generation(self, result: str | list[str]) -> None:
        if isinstance(self.state.generation, GenerationRunning):
            self.state.generation = GenerationComplete(id=self.state.generation.id, result=result)

    @with_state_lock
    def fail_generation(self, error: str) -> None:
        match self.state.generation:
            case GenerationRunning(id=generation_id):
                logger.error("Generation %s failed: %s", generation_id, error)
                self.state.generation = GenerationError(id=generation_id, error=error)
            case GenerationCancelled():
                return
            case _:
                logger.error("Generation failed without active running job: %s", error)

    @with_state_lock
    def get_generation_progress(self) -> GenerationProgressResponse:
        match self.state.generation:
            case GenerationRunning(progress=progress):
                return GenerationProgressResponse(
                    status="running",
                    phase=progress.phase,
                    progress=int(progress.progress),
                    currentStep=progress.current_step,
                    totalSteps=progress.total_steps,
                    phaseIndex=progress.phase_index,
                    phaseCount=progress.phase_count,
                    sectionIndex=progress.section_index,
                    sectionCount=progress.section_count,
                    statusDetail=progress.status_detail,
                    previewUrl=progress.preview_url,
                    downloadCurrentFile=progress.download_current_file,
                    downloadCurrentFileProgress=progress.download_current_file_progress,
                    downloadTotalProgress=progress.download_total_progress,
                )
            case GenerationComplete():
                return GenerationProgressResponse(status="complete", phase="complete", progress=100, currentStep=0, totalSteps=0)
            case GenerationCancelled():
                return GenerationProgressResponse(status="cancelled", phase="cancelled", progress=0, currentStep=0, totalSteps=0)
            case GenerationError():
                return GenerationProgressResponse(status="error", phase="error", progress=0, currentStep=0, totalSteps=0)
            case _:
                return GenerationProgressResponse(status="idle", phase="", progress=0, currentStep=0, totalSteps=0)

    @with_state_lock
    def is_generation_running(self) -> bool:
        return isinstance(self.state.generation, GenerationRunning)
