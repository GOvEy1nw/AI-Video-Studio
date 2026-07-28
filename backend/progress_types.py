"""Dependency-free runtime progress types shared by backend layers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

DownloadUnit = Literal["bytes", "files"]


@dataclass(frozen=True)
class ModelDownloadProgress:
    phase: str | None
    model_type: str | None
    model_name: str | None
    source: str | None
    repo_id: str | None
    filename: str | None
    unit: DownloadUnit
    current: int
    total: int | None
    percent: float | None
    speed_bps: float | None
    eta_seconds: float | None
    file_index: int | None
    file_count: int | None
