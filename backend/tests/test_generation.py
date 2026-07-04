"""Integration-style tests for generation and image endpoints.

Phase 4 rework: every live generation path routes through the WanGP
bridge. The cloud/API and local LTX/ZIT pipeline paths were disabled in
Phase 2 and their tests removed; the remaining tests exercise the WanGP
bridge via the ``enable_wangp`` fixture (which swaps in
``FakeWanGPBridge`` and flips the runtime config flag on for one test).
"""

from __future__ import annotations

from pathlib import Path

from state.app_state_types import GpuSlot, VideoPipelineState, VideoPipelineWarmth
from tests.fakes.fake_wangp_bridge import FakeWanGPBridge
from tests.fakes.services import FakeFastVideoPipeline

_T2V_JSON = {
    "prompt": "test",
    "resolution": "540p",
    "model": "fast",
    "duration": "2",
    "fps": "24",
}


def _fake_running_generation_state(test_state) -> None:
    pipeline = FakeFastVideoPipeline()
    test_state.state.gpu_slot = GpuSlot(
        active_pipeline=VideoPipelineState(
            pipeline=pipeline,
            warmth=VideoPipelineWarmth.COLD,
            is_compiled=False,
        ),
        generation=None,
    )
    test_state.generation.start_generation("running")


class TestGenerate:
    """WanGP-backed video generation through ``POST /api/generate``."""

    def test_t2v_happy_path(self, client, enable_wangp: FakeWanGPBridge):
        r = client.post(
            "/api/generate",
            json={
                "prompt": "A beautiful sunset",
                "resolution": "1080p",
                "model": "fast",
                "duration": "2",
                "fps": "24",
                "cameraMotion": "none",
            },
        )

        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "complete"
        assert data["video_path"] is not None
        assert Path(data["video_path"]).exists()

        assert len(enable_wangp.video_calls) == 1
        call = enable_wangp.video_calls[0]
        assert call.prompt == "A beautiful sunset"
        assert call.resolution_label == "1080p"
        assert call.aspect_ratio == "16:9"
        assert call.duration_seconds == 2
        assert call.fps == 24

    def test_already_running(self, client, enable_wangp: FakeWanGPBridge, test_state):
        _fake_running_generation_state(test_state)

        r = client.post("/api/generate", json=_T2V_JSON)
        assert r.status_code == 409

    def test_i2v_nonexistent_image(self, client, enable_wangp: FakeWanGPBridge):
        r = client.post(
            "/api/generate",
            json={**_T2V_JSON, "imagePath": "/no/such/file.png"},
        )
        assert r.status_code == 400

    def test_i2v_rejects_invalid_image_content_400(
        self, client, enable_wangp: FakeWanGPBridge, tmp_path: Path
    ):
        bad_image = tmp_path / "bad.png"
        bad_image.write_bytes(b"not-a-real-png")

        r = client.post(
            "/api/generate",
            json={**_T2V_JSON, "imagePath": str(bad_image)},
        )
        assert r.status_code == 400
        assert "Invalid image file" in r.json()["error"]

    def test_resolution_mapping_540p(self, client, enable_wangp: FakeWanGPBridge):
        r = client.post("/api/generate", json=_T2V_JSON)
        assert r.status_code == 200

        call = enable_wangp.video_calls[0]
        assert call.resolution_label == "540p"
        assert call.aspect_ratio == "16:9"

    def test_resolution_mapping_720p(self, client, enable_wangp: FakeWanGPBridge):
        r = client.post("/api/generate", json={**_T2V_JSON, "resolution": "720p"})
        assert r.status_code == 200

        call = enable_wangp.video_calls[0]
        assert call.resolution_label == "720p"

    def test_locked_seed(self, client, enable_wangp: FakeWanGPBridge, test_state):
        test_state.state.app_settings.seed_locked = True
        test_state.state.app_settings.locked_seed = 123

        r = client.post("/api/generate", json=_T2V_JSON)
        assert r.status_code == 200

        assert enable_wangp.video_calls[0].seed == 123

    def test_error_sets_generation_error(self, client, enable_wangp: FakeWanGPBridge, test_state):
        enable_wangp.raise_on_video = RuntimeError("GPU OOM")

        r = client.post("/api/generate", json=_T2V_JSON)
        assert r.status_code == 500

        progress = test_state.generation.get_generation_progress()
        assert progress.status == "error"

    def test_cancelled_response(self, client, enable_wangp: FakeWanGPBridge):
        enable_wangp.raise_on_video = RuntimeError("cancelled")

        r = client.post("/api/generate", json=_T2V_JSON)
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"


class TestGenerateCancel:
    def test_cancel_active(self, client, test_state):
        _fake_running_generation_state(test_state)

        r = client.post("/api/generate/cancel")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "cancelling"

    def test_cancel_no_active(self, client):
        r = client.post("/api/generate/cancel")
        assert r.status_code == 200
        assert r.json()["status"] == "no_active_generation"


class TestGenerationProgress:
    def test_idle(self, client):
        r = client.get("/api/generation/progress")
        assert r.status_code == 200
        assert r.json()["status"] == "idle"

    def test_running(self, client, test_state):
        _fake_running_generation_state(test_state)
        test_state.generation.update_progress("inference", 50, 4, 8)

        r = client.get("/api/generation/progress")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "running"
        assert data["phase"] == "inference"
        assert data["progress"] == 50
        assert data["currentStep"] == 4
        assert data["totalSteps"] == 8

    def test_running_from_api_generation_state(self, client, test_state):
        test_state.generation.start_api_generation("api-running")
        test_state.generation.update_progress("inference", 35)

        r = client.get("/api/generation/progress")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "running"
        assert data["phase"] == "inference"
        assert data["progress"] == 35
        assert data["currentStep"] is None
        assert data["totalSteps"] is None


class TestGenerateImage:
    """WanGP-backed image generation through ``POST /api/generate-image``."""

    def test_happy_path(self, client, enable_wangp: FakeWanGPBridge):
        r = client.post(
            "/api/generate-image",
            json={"prompt": "A cat", "width": 1024, "height": 1024, "numSteps": 8},
        )

        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "complete"
        assert len(data["image_paths"]) == 1
        assert Path(data["image_paths"][0]).exists()

        assert len(enable_wangp.image_calls) == 1
        call = enable_wangp.image_calls[0]
        assert call.prompt == "A cat"
        assert call.width == 1024
        assert call.height == 1024
        assert call.num_steps == 8

    def test_dimension_clamping(self, client, enable_wangp: FakeWanGPBridge):
        # WanGP bridge receives the request dimensions directly; the bridge
        # is responsible for any alignment. The handler still passes the
        # raw WxH through, so we assert the call captures 1023x1023.
        r = client.post(
            "/api/generate-image",
            json={"prompt": "test", "width": 1023, "height": 1023},
        )
        assert r.status_code == 200

        call = enable_wangp.image_calls[0]
        assert call.width == 1008
        assert call.height == 1008

    def test_num_images_clamped(self, client, enable_wangp: FakeWanGPBridge):
        r = client.post(
            "/api/generate-image",
            json={"prompt": "test", "numImages": 20},
        )
        assert r.status_code == 200

        # The handler clamps num_images to the 1..12 range before invoking
        # the bridge; the fake bridge writes one file per requested image.
        call = enable_wangp.image_calls[0]
        assert call.num_images == 12
        assert len(r.json()["image_paths"]) == 12

    def test_error(self, client, enable_wangp: FakeWanGPBridge):
        enable_wangp.raise_on_images = RuntimeError("GPU OOM")

        r = client.post("/api/generate-image", json={"prompt": "test"})
        assert r.status_code == 500

    def test_cancelled(self, client, enable_wangp: FakeWanGPBridge):
        enable_wangp.raise_on_images = RuntimeError("cancelled")

        r = client.post("/api/generate-image", json={"prompt": "test"})
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"


class TestEmptyPromptRejected:
    def test_empty_prompt_rejected(self, client):
        r = client.post("/api/generate", json={"prompt": ""})
        assert r.status_code == 422

    def test_whitespace_prompt_rejected(self, client):
        r = client.post("/api/generate", json={"prompt": "   "})
        assert r.status_code == 422

    def test_missing_prompt_rejected(self, client):
        r = client.post("/api/generate", json={})
        assert r.status_code == 422

    def test_empty_image_prompt_rejected(self, client):
        r = client.post("/api/generate-image", json={"prompt": ""})
        assert r.status_code == 422

    def test_whitespace_image_prompt_rejected(self, client):
        r = client.post("/api/generate-image", json={"prompt": "   "})
        assert r.status_code == 422

    def test_missing_image_prompt_rejected(self, client):
        r = client.post("/api/generate-image", json={})
        assert r.status_code == 422
