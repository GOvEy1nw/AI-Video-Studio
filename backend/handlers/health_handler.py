"""Health and startup lifecycle handler."""

from __future__ import annotations

from threading import RLock
from typing import TYPE_CHECKING

from api_types import GpuInfoResponse, GpuTelemetry, HealthResponse, ModelStatusItem
from handlers.base import StateHandlerBase, with_state_lock
from logging_policy import log_background_exception
from services.interfaces import GpuInfo
from services.wangp_bridge import WanGPBridge
from state.app_state_types import AppState, StartupError, StartupLoading, StartupPending, StartupReady

if TYPE_CHECKING:
    from runtime_config.runtime_config import RuntimeConfig


class HealthHandler(StateHandlerBase):
    def __init__(
        self,
        state: AppState,
        lock: RLock,
        gpu_info: GpuInfo,
        config: RuntimeConfig,
        use_sage_attention: bool,
        wangp_bridge: WanGPBridge,
    ) -> None:
        super().__init__(state, lock)
        self._gpu_info = gpu_info
        self._config = config
        self._use_sage_attention = use_sage_attention
        self._wangp_bridge = wangp_bridge

    def get_health(self) -> HealthResponse:
        bridge = self._wangp_bridge.get_status()
        models_ready = bridge.available and bridge.session_ready
        return HealthResponse(
            status="ok",
            models_loaded=models_ready,
            active_model="wangp" if models_ready else None,
            gpu_info=GpuTelemetry(**self._gpu_info.get_gpu_info()),
            sage_attention=self._use_sage_attention,
            models_status=[
                ModelStatusItem(
                    id="fast",
                    name="WanGP LTX-2.3 Distilled",
                    loaded=models_ready,
                    downloaded=models_ready,
                ),
            ],
        )

    def get_gpu_info(self) -> GpuInfoResponse:
        return GpuInfoResponse(
            cuda_available=self._gpu_info.get_cuda_available(),
            mps_available=self._gpu_info.get_mps_available(),
            gpu_available=self._gpu_info.get_gpu_available(),
            gpu_name=self._gpu_info.get_device_name(),
            vram_gb=self._gpu_info.get_vram_total_gb(),
            gpu_info=GpuTelemetry(**self._gpu_info.get_gpu_info()),
        )

    @with_state_lock
    def set_startup_pending(self, message: str) -> None:
        self.state.startup = StartupPending(message=message)

    @with_state_lock
    def set_startup_loading(self, step: str, progress: float) -> None:
        self.state.startup = StartupLoading(current_step=step, progress=progress)

    @with_state_lock
    def set_startup_ready(self) -> None:
        self.state.startup = StartupReady()

    @with_state_lock
    def set_startup_error(self, error: str) -> None:
        self.state.startup = StartupError(error=error)

    def default_warmup(self) -> None:
        try:
            self.set_startup_loading("Initializing WanGP session", 20)
            try:
                self._wangp_bridge.preload_session()
            except Exception as exc:
                self.set_startup_error(f"Failed to preload WanGP session: {exc}")
                return

            status = self._wangp_bridge.get_status()
            if status.available and status.session_ready:
                self.set_startup_ready()
            else:
                self.set_startup_error(status.reason or "WanGP bridge session is not ready")
        except Exception as exc:
            log_background_exception("health-default-warmup", exc)
            self.set_startup_error(str(exc))
