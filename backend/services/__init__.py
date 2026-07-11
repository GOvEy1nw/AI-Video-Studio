"""State service package exports (interface-first, import-safe)."""

from services.interfaces import GpuInfo, GpuTelemetryPayload

__all__ = [
    "GpuInfo",
    "GpuTelemetryPayload",
]
