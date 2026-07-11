"""Canonical state model for backend runtime state."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from state.app_settings import AppSettings


@dataclass
class GenerationProgress:
    phase: str
    progress: float
    current_step: int | None
    total_steps: int | None
    phase_index: int | None = None
    phase_count: int | None = None
    section_index: int | None = None
    section_count: int | None = None
    status_detail: str | None = None
    preview_url: str | None = None
    download_current_file: str | None = None
    download_current_file_progress: int | None = None
    download_total_progress: int | None = None


@dataclass
class GenerationRunning:
    id: str
    progress: GenerationProgress


@dataclass
class GenerationComplete:
    id: str
    result: str | list[str]


@dataclass
class GenerationError:
    id: str
    error: str


@dataclass
class GenerationCancelled:
    id: str


GenerationState = GenerationRunning | GenerationComplete | GenerationError | GenerationCancelled


# ============================================================
# Startup lifecycle
# ============================================================

# Internal warmup lifecycle markers consumed by AppHandler.default_warmup().

@dataclass
class StartupPending:
    message: str


@dataclass
class StartupLoading:
    current_step: str
    progress: float


@dataclass
class StartupReady:
    pass


@dataclass
class StartupError:
    error: str


StartupState = StartupPending | StartupLoading | StartupReady | StartupError


# ============================================================
# Top-level state
# ============================================================


@dataclass
class AppState:
    generation: GenerationState | None
    startup: StartupState
    app_settings: AppSettings
