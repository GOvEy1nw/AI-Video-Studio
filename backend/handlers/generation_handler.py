"""Generation lifecycle handler."""

from __future__ import annotations

import logging
from typing import Literal

from api_types import CancelResponse, GenerationProgressResponse
from handlers.base import StateHandlerBase, with_state_lock
from state.app_state_types import (
    GenerationCancelled,
    GenerationComplete,
    GenerationError,
    GenerationProgress,
    GenerationRunning,
    GenerationState,
    GpuSlot,
)

logger = logging.getLogger(__name__)
GenerationSlot = Literal["gpu", "api"]


class GenerationHandler(StateHandlerBase):
    @with_state_lock
    def start_generation(self, generation_id: str) -> None:
        if self.is_generation_running():
            raise RuntimeError("Generation already in progress")
        if self.state.gpu_slot is None:
            raise RuntimeError("No active GPU pipeline")

        self.state.gpu_slot.generation = GenerationRunning(
            id=generation_id,
            progress=GenerationProgress(phase="", progress=0, current_step=0, total_steps=0),
        )

    @with_state_lock
    def start_api_generation(self, generation_id: str) -> None:
        if self.is_generation_running():
            raise RuntimeError("Generation already in progress")

        self.state.api_generation = GenerationRunning(
            id=generation_id,
            progress=GenerationProgress(phase="", progress=0, current_step=None, total_steps=None),
        )

    @with_state_lock
    def _gpu_generation(self) -> GenerationState | None:
        match self.state.gpu_slot:
            case GpuSlot(generation=generation):
                return generation
            case _:
                return None

    @with_state_lock
    def _running_slot(self) -> GenerationSlot | None:
        if isinstance(self._gpu_generation(), GenerationRunning):
            return "gpu"
        if isinstance(self.state.api_generation, GenerationRunning):
            return "api"
        return None

    @with_state_lock
    def _generation_for_polling(self) -> GenerationState | None:
        gpu_gen = self._gpu_generation()
        api_gen = self.state.api_generation

        for generation_type in (GenerationRunning, GenerationCancelled, GenerationError, GenerationComplete):
            if isinstance(gpu_gen, generation_type):
                return gpu_gen
            if isinstance(api_gen, generation_type):
                return api_gen

        return None

    @with_state_lock
    def is_generation_cancelled(self) -> bool:
        match self.state.gpu_slot:
            case GpuSlot(generation=GenerationCancelled()):
                return True
            case GpuSlot(generation=GenerationRunning()):
                return False
            case _:
                return isinstance(self.state.api_generation, GenerationCancelled)

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
        match self._running_slot():
            case "gpu":
                match self.state.gpu_slot:
                    case GpuSlot(generation=GenerationRunning() as running):
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
                    case _:
                        return
            case "api":
                match self.state.api_generation:
                    case GenerationRunning() as running:
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
                    case _:
                        return
            case _:
                return

    @with_state_lock
    def cancel_generation(self) -> CancelResponse:
        match self._running_slot():
            case "gpu":
                match self.state.gpu_slot:
                    case GpuSlot(generation=GenerationRunning(id=generation_id)):
                        cancelled = GenerationCancelled(id=generation_id)
                        self.state.gpu_slot.generation = cancelled
                        return CancelResponse(status="cancelling", id=cancelled.id)
                    case _:
                        pass
            case "api":
                match self.state.api_generation:
                    case GenerationRunning(id=generation_id):
                        cancelled = GenerationCancelled(id=generation_id)
                        self.state.api_generation = cancelled
                        return CancelResponse(status="cancelling", id=cancelled.id)
                    case _:
                        pass
            case _:
                pass

        match self.state.gpu_slot:
            case GpuSlot(generation=GenerationCancelled(id=generation_id)):
                return CancelResponse(status="cancelling", id=generation_id)
            case _:
                pass

        match self.state.api_generation:
            case GenerationCancelled(id=generation_id):
                return CancelResponse(status="cancelling", id=generation_id)
            case _:
                pass

        return CancelResponse(status="no_active_generation")

    @with_state_lock
    def complete_generation(self, result: str | list[str]) -> None:
        match self._running_slot():
            case "gpu":
                match self.state.gpu_slot:
                    case GpuSlot(generation=GenerationRunning(id=generation_id)) as gpu_slot:
                        gpu_slot.generation = GenerationComplete(id=generation_id, result=result)
                    case _:
                        return
            case "api":
                match self.state.api_generation:
                    case GenerationRunning(id=generation_id):
                        self.state.api_generation = GenerationComplete(id=generation_id, result=result)
                    case _:
                        return
            case _:
                return

    @with_state_lock
    def fail_generation(self, error: str) -> None:
        match self._running_slot():
            case "gpu":
                match self.state.gpu_slot:
                    case GpuSlot(generation=GenerationRunning(id=generation_id)) as gpu_slot:
                        logger.error("Generation %s failed: %s", generation_id, error)
                        gpu_slot.generation = GenerationError(id=generation_id, error=error)
                    case _:
                        logger.error("Generation failed without active running job: %s", error)
                return
            case "api":
                match self.state.api_generation:
                    case GenerationRunning(id=generation_id):
                        logger.error("Generation %s failed: %s", generation_id, error)
                        self.state.api_generation = GenerationError(id=generation_id, error=error)
                    case _:
                        logger.error("Generation failed without active running job: %s", error)
                return
            case _:
                if isinstance(self._gpu_generation(), GenerationCancelled) or isinstance(
                    self.state.api_generation, GenerationCancelled
                ):
                    return
                logger.error("Generation failed without active running job: %s", error)
                return

    @with_state_lock
    def get_generation_progress(self) -> GenerationProgressResponse:
        gen = self._generation_for_polling()

        match gen:
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
                return GenerationProgressResponse(
                    status="complete",
                    phase="complete",
                    progress=100,
                    currentStep=0,
                    totalSteps=0,
                )
            case GenerationCancelled():
                return GenerationProgressResponse(
                    status="cancelled",
                    phase="cancelled",
                    progress=0,
                    currentStep=0,
                    totalSteps=0,
                )
            case GenerationError():
                return GenerationProgressResponse(
                    status="error",
                    phase="error",
                    progress=0,
                    currentStep=0,
                    totalSteps=0,
                )
            case _:
                return GenerationProgressResponse(
                    status="idle",
                    phase="",
                    progress=0,
                    currentStep=0,
                    totalSteps=0,
                )

    @with_state_lock
    def is_generation_running(self) -> bool:
        return self._running_slot() is not None
