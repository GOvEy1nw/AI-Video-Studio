"""State action and invariant tests for AppState."""

from __future__ import annotations

import pytest

from progress_types import ModelDownloadProgress
from state.app_settings import UpdateSettingsRequest
from state.app_state_types import StartupError, StartupLoading, StartupPending, StartupReady


def test_generation_mutex_prevents_second_start(test_state):
    test_state.generation.start_generation_job("gen-1")

    with pytest.raises(RuntimeError, match="Generation already in progress"):
        test_state.generation.start_generation_job("gen-2")


def test_cancel_marks_running_generation(test_state):
    test_state.generation.start_generation_job("gen-1")

    out = test_state.generation.cancel_generation()
    assert out.status == "cancelling"
    assert out.id == "gen-1"


def test_generation_progress_reports_completion(test_state):
    test_state.generation.start_generation_job("gen-1")
    test_state.generation.complete_generation("/tmp/out.mp4")

    progress = test_state.generation.get_generation_progress()
    assert progress.status == "complete"


def test_generation_progress_updates(test_state):
    test_state.generation.start_generation_job("api-gen-1")
    test_state.generation.update_progress("inference", 25, 1, 4)

    progress = test_state.generation.get_generation_progress()
    assert progress.status == "running"
    assert progress.phase == "inference"
    assert progress.progress == 25


def test_generation_download_progress_serializes_and_clears(test_state):
    test_state.generation.start_generation_job("api-gen-download")
    transfer = ModelDownloadProgress(
        phase="downloading",
        model_type="ltx2",
        model_name="LTX 2.3 Fast",
        source="huggingface",
        repo_id="owner/repo",
        filename="model.safetensors",
        unit="bytes",
        current=50,
        total=100,
        percent=50,
        speed_bps=10,
        eta_seconds=5,
        file_index=1,
        file_count=2,
    )
    test_state.generation.update_progress(
        "downloading_model",
        10,
        50,
        100,
        progress_unit="bytes",
        model_download=transfer,
    )

    progress = test_state.generation.get_generation_progress()
    assert progress.progressUnit == "bytes"
    assert progress.modelDownload is not None
    assert progress.modelDownload.filename == "model.safetensors"
    assert progress.modelDownload.speedBps == 10
    assert progress.downloadCurrentFileProgress == 50
    assert progress.downloadTotalProgress is None

    test_state.generation.update_progress("inference", 25, 1, 4)
    progress = test_state.generation.get_generation_progress()
    assert progress.progressUnit is None
    assert progress.modelDownload is None
    assert progress.downloadCurrentFile is None


def test_cancel_marks_running_api_generation(test_state):
    test_state.generation.start_generation_job("api-gen-1")

    out = test_state.generation.cancel_generation()
    assert out.status == "cancelling"
    assert out.id == "api-gen-1"


def test_startup_state_transitions_are_tracked(test_state):
    test_state.health.set_startup_pending("waiting")
    assert isinstance(test_state.state.startup, StartupPending)

    test_state.health.set_startup_loading("warming", 60)
    assert isinstance(test_state.state.startup, StartupLoading)

    test_state.health.set_startup_ready()
    assert isinstance(test_state.state.startup, StartupReady)

    test_state.health.set_startup_error("boom")
    assert isinstance(test_state.state.startup, StartupError)


def test_handler_attributes_are_wired(test_state):
    assert test_state.settings is not None
    assert test_state.generation is not None
    assert test_state.video_generation is not None
    assert test_state.image_generation is not None
    assert test_state.health is not None


def test_rlock_allows_nested_handler_calls(test_state):
    test_state.settings.update_settings(UpdateSettingsRequest(useTorchCompile=True))
    assert test_state.state.app_settings.use_torch_compile is True


def test_wangp_startup_preloads_session_and_marks_ready(test_state, wangp_bridge):
    test_state.config.wangp_enabled = True
    wangp_bridge.session_ready = False

    test_state.health.default_warmup()

    assert wangp_bridge.preload_calls == 1
    assert wangp_bridge.session_ready is True
    assert isinstance(test_state.state.startup, StartupReady)
