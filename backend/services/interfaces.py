"""Compatibility re-exports for service interfaces."""

from __future__ import annotations

from services.gpu_info.gpu_info import GpuInfo, GpuTelemetryPayload

__all__ = [
    "GpuTelemetryPayload",
    "GpuInfo",
]
