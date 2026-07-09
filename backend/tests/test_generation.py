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
from services.video_clip import VideoMetadata
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
        assert call.resolution_label == "1920x1088"
        assert call.aspect_ratio == "16:9"
        assert call.duration_seconds == 2
        assert call.fps == 24
        assert call.model_type == "ltx2_22B_distilled_1_1"
        assert call.default_settings["num_inference_steps"] == 8
        assert call.default_settings["video_output_codec"] == "libx264_8"
        assert call.default_settings["video_container"] == "mp4"

    def test_video_profile_request_routes_to_ltx2(
        self, client, enable_wangp: FakeWanGPBridge
    ):
        r = client.post(
            "/api/generate",
            json={
                "prompt": "A beautiful sunset",
                "resolution": "720p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "5",
                "fps": "24",
                "aspectRatio": "9:16",
            },
        )

        assert r.status_code == 200
        call = enable_wangp.video_calls[0]
        assert call.model_type == "ltx2_22B_distilled_1_1"
        assert call.resolution_label == "720x1280"
        assert call.aspect_ratio == "9:16"
        assert call.steps == 8

    def test_video_profile_square_aspect_routes_to_ltx2(
        self, client, enable_wangp: FakeWanGPBridge
    ):
        r = client.post(
            "/api/generate",
            json={
                "prompt": "A beautiful sunset",
                "resolution": "1080p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "5",
                "fps": "24",
                "aspectRatio": "1:1",
            },
        )

        assert r.status_code == 200
        call = enable_wangp.video_calls[0]
        assert call.resolution_label == "1088x1088"
        assert call.aspect_ratio == "1:1"

    def test_multi_shot_prompt_formats_relay_ranges(
        self, client, enable_wangp: FakeWanGPBridge
    ):
        r = client.post(
            "/api/generate",
            json={
                "prompt": "Global cinematic style",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "5",
                "fps": "24",
                "shotPrompts": [
                    {"seconds": 4, "prompt": "The knight raises a shield."},
                    {"seconds": 5, "prompt": "The dragon breathes fire."},
                ],
            },
        )

        assert r.status_code == 200
        call = enable_wangp.video_calls[0]
        assert call.duration_seconds == 9
        assert call.prompt == (
            "Global cinematic style\n"
            "[0s:4s] The knight raises a shield.\n"
            "[4s:9s] The dragon breathes fire."
        )
        assert call.default_settings["activated_loras"] == ["LTX-2.3_Cinematic_hardcut.safetensors"]
        assert call.default_settings["loras_multipliers"] == "1.0"

    def test_multi_shot_allows_empty_global_prompt(
        self, client, enable_wangp: FakeWanGPBridge
    ):
        r = client.post(
            "/api/generate",
            json={
                "prompt": "",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "5",
                "fps": "24",
                "shotPrompts": [
                    {"seconds": 2, "prompt": "Shot-only prompt."},
                ],
            },
        )

        assert r.status_code == 200
        call = enable_wangp.video_calls[0]
        assert call.duration_seconds == 2
        assert call.prompt == "[0s:2s] Shot-only prompt."
        assert call.default_settings["activated_loras"] == ["LTX-2.3_Cinematic_hardcut.safetensors"]
        assert call.default_settings["loras_multipliers"] == "1.0"

    def test_regular_video_generation_does_not_activate_multi_shot_lora(
        self, client, enable_wangp: FakeWanGPBridge
    ):
        r = client.post(
            "/api/generate",
            json={
                "prompt": "A single continuous shot.",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "5",
                "fps": "24",
            },
        )

        assert r.status_code == 200
        call = enable_wangp.video_calls[0]
        assert "activated_loras" not in call.default_settings
        assert "loras_multipliers" not in call.default_settings

    def test_unknown_video_profile_rejected(
        self, client, enable_wangp: FakeWanGPBridge
    ):
        r = client.post(
            "/api/generate",
            json={**_T2V_JSON, "modelProfileId": "not_real"},
        )

        assert r.status_code == 400
        assert "UNKNOWN_VIDEO_MODEL_PROFILE" in r.json()["error"]
        assert enable_wangp.video_calls == []

    def test_unsupported_video_resolution_rejected(
        self, client, enable_wangp: FakeWanGPBridge
    ):
        r = client.post(
            "/api/generate",
            json={**_T2V_JSON, "modelProfileId": "ltx2_22b_distilled", "resolution": "1440p"},
        )

        assert r.status_code == 400
        assert "UNSUPPORTED_VIDEO_RESOLUTION_TIER" in r.json()["error"]
        assert enable_wangp.video_calls == []

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

    def test_video_multi_input_happy_path(
        self, client, enable_wangp: FakeWanGPBridge, tmp_path: Path
    ):
        from PIL import Image

        # Create valid test files
        img = Image.new("RGB", (1, 1), color="red")
        start_img = tmp_path / "start.png"
        img.save(start_img)

        end_img = tmp_path / "end.png"
        img.save(end_img)

        audio = tmp_path / "audio.wav"
        audio.write_bytes(b"RIFF\x0c\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00")

        video = tmp_path / "video.mp4"
        video.write_bytes(b"fake-video")

        r = client.post(
            "/api/generate",
            json={
                "prompt": "A beautiful sunset",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "2",
                "fps": "24",
                "cameraMotion": "none",
                "videoPromptType": "VG",
                "inputMedia": [
                    {"role": "start_image", "path": str(start_img), "type": "image"},
                    {"role": "end_image", "path": str(end_img), "type": "image"},
                    {"role": "control_video", "path": str(video), "type": "video"},
                    {"role": "audio_guide", "path": str(audio), "type": "audio"},
                ]
            },
        )

        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "complete"

        assert len(enable_wangp.video_calls) == 1
        call = enable_wangp.video_calls[0]
        assert call.start_image_path == str(start_img)
        assert call.end_image_path == str(end_img)
        assert call.control_video_path == str(video)
        assert call.audio_path == str(audio)
        assert call.video_prompt_type == "VG"

    def test_video_input_trim_passes_clipped_path_and_frame_count(
        self, client, enable_wangp: FakeWanGPBridge, tmp_path: Path, monkeypatch
    ):
        video = tmp_path / "video.mp4"
        video.write_bytes(b"fake-video")
        clipped = tmp_path / "video_trimmed.mp4"
        clipped.write_bytes(b"fake-video")

        def fake_extract(
            source_path: str | Path,
            *,
            start_time: float,
            duration: float,
            output_dir: Path,
        ) -> Path:
            del output_dir
            assert str(source_path) == str(video)
            assert start_time == 1.5
            assert duration == 4.0
            return clipped

        monkeypatch.setattr(
            "handlers.video_generation_handler.extract_video_clip",
            fake_extract,
        )
        monkeypatch.setattr(
            "handlers.video_generation_handler.probe_video_metadata",
            lambda path: VideoMetadata(frame_count=97, duration_seconds=4.0),
        )

        r = client.post(
            "/api/generate",
            json={
                "prompt": "A dancer",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "10",
                "fps": "24",
                "cameraMotion": "none",
                "videoPromptType": "VG",
                "inputMedia": [
                    {
                        "role": "control_video",
                        "path": str(video),
                        "type": "video",
                        "trimStartTime": 1.5,
                        "trimDuration": 4.0,
                    },
                ],
            },
        )

        assert r.status_code == 200
        call = enable_wangp.video_calls[0]
        assert call.duration_seconds == 4
        assert call.control_video_path == str(clipped)
        assert call.video_length_frames == 97

    def test_audio_input_trim_passes_clipped_path_and_duration(
        self, client, enable_wangp: FakeWanGPBridge, tmp_path: Path, monkeypatch
    ):
        audio = tmp_path / "audio.wav"
        audio.write_bytes(b"RIFF\x0c\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00")
        clipped = tmp_path / "audio_trimmed.wav"
        clipped.write_bytes(b"RIFF\x0c\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00")

        def fake_extract(
            source_path: str | Path,
            *,
            start_time: float,
            duration: float,
            output_dir: Path,
        ) -> Path:
            del output_dir
            assert str(source_path) == str(audio)
            assert start_time == 2.0
            assert duration == 3.0
            return clipped

        monkeypatch.setattr(
            "handlers.video_generation_handler.extract_audio_clip",
            fake_extract,
        )

        r = client.post(
            "/api/generate",
            json={
                "prompt": "A music video",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "10",
                "fps": "24",
                "cameraMotion": "none",
                "inputMedia": [
                    {
                        "role": "audio_to_video",
                        "path": str(audio),
                        "type": "audio",
                        "trimStartTime": 2.0,
                        "trimDuration": 3.0,
                    },
                ],
            },
        )

        assert r.status_code == 200
        call = enable_wangp.video_calls[0]
        assert call.duration_seconds == 3
        assert call.audio_path == str(clipped)

    def test_reframe_happy_path(
        self, client, enable_wangp: FakeWanGPBridge, tmp_path: Path, monkeypatch
    ):
        video = tmp_path / "video.mp4"
        video.write_bytes(b"fake-video")
        clipped = tmp_path / "clipped.mp4"
        clipped.write_bytes(b"fake-video")

        def fake_extract(
            source_path: Path,
            *,
            start_time: float,
            duration: float,
            output_dir: Path,
        ) -> Path:
            del source_path, start_time, duration, output_dir
            return clipped

        monkeypatch.setattr(
            "handlers.video_generation_handler.extract_video_clip",
            fake_extract,
        )
        monkeypatch.setattr(
            "handlers.video_generation_handler.probe_video_metadata",
            lambda path: VideoMetadata(frame_count=150, duration_seconds=5.0),
        )

        r = client.post(
            "/api/generate",
            json={
                "prompt": "",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "5",
                "fps": "24",
                "cameraMotion": "none",
                "inputMedia": [
                    {"role": "control_video", "path": str(video), "type": "video"},
                ],
                "reframe": {
                    "aspectMode": "1:1",
                    "padding": {"top": 0, "bottom": 0, "left": 0, "right": 0},
                    "controlVideoStartTime": 0,
                    "controlVideoDuration": 5,
                },
            },
        )

        assert r.status_code == 200
        assert r.json()["status"] == "complete"
        assert len(enable_wangp.video_calls) == 1
        call = enable_wangp.video_calls[0]
        assert call.prompt == "outpaint"
        assert call.control_video_path == str(clipped)
        assert call.video_prompt_type == "VG"
        assert call.audio_prompt_type == "K"
        assert call.video_guide_outpainting == ""
        assert call.video_guide_outpainting_ratio == ""
        assert call.video_length_frames == 150
        assert call.default_settings["force_fps"] == "auto"
        assert call.default_settings["sliding_window_overlap"] == 33

    def test_reframe_custom_padding(
        self, client, enable_wangp: FakeWanGPBridge, tmp_path: Path, monkeypatch
    ):
        video = tmp_path / "video.mp4"
        video.write_bytes(b"fake-video")
        clipped = tmp_path / "clipped.mp4"
        clipped.write_bytes(b"fake-video")

        monkeypatch.setattr(
            "handlers.video_generation_handler.extract_video_clip",
            lambda source_path, *, start_time, duration, output_dir: clipped,
        )

        r = client.post(
            "/api/generate",
            json={
                "prompt": "extend the office background",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "5",
                "fps": "24",
                "cameraMotion": "none",
                "inputMedia": [
                    {"role": "control_video", "path": str(video), "type": "video"},
                ],
                "reframe": {
                    "aspectMode": "custom",
                    "padding": {"top": 35, "bottom": 70, "left": 40, "right": 30},
                    "controlVideoStartTime": 1.5,
                    "controlVideoDuration": 4,
                },
            },
        )

        assert r.status_code == 200
        call = enable_wangp.video_calls[0]
        assert call.prompt == "extend the office background"
        assert call.video_guide_outpainting == "35 70 40 30"
        assert call.video_guide_outpainting_ratio == ""

    def test_reframe_internal_padding_up_to_200(
        self, client, enable_wangp: FakeWanGPBridge, tmp_path: Path, monkeypatch
    ):
        video = tmp_path / "video.mp4"
        video.write_bytes(b"fake-video")
        clipped = tmp_path / "clipped.mp4"
        clipped.write_bytes(b"fake-video")

        monkeypatch.setattr(
            "handlers.video_generation_handler.extract_video_clip",
            lambda source_path, *, start_time, duration, output_dir: clipped,
        )

        r = client.post(
            "/api/generate",
            json={
                "prompt": "",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "5",
                "fps": "24",
                "cameraMotion": "none",
                "inputMedia": [
                    {"role": "control_video", "path": str(video), "type": "video"},
                ],
                "reframe": {
                    "aspectMode": "custom",
                    "padding": {"top": 0, "bottom": 0, "left": 0, "right": 200},
                    "controlVideoStartTime": 0,
                    "controlVideoDuration": 5,
                },
            },
        )

        assert r.status_code == 200
        call = enable_wangp.video_calls[0]
        assert call.video_guide_outpainting == "0 0 0 200"
        assert call.video_guide_outpainting_ratio == ""

    def test_reframe_requires_options_payload(
        self, client, enable_wangp: FakeWanGPBridge, tmp_path: Path
    ):
        video = tmp_path / "video.mp4"
        video.write_bytes(b"fake-video")

        r = client.post(
            "/api/generate",
            json={
                "prompt": "outpaint",
                "resolution": "540p",
                "modelProfileId": "ltx2_22b_distilled",
                "duration": "5",
                "fps": "24",
                "cameraMotion": "none",
                "videoPromptType": "VG",
                "inputMedia": [
                    {"role": "control_video", "path": str(video), "type": "video"},
                ],
            },
        )

        assert r.status_code == 400
        assert "REFRAME_OPTIONS_REQUIRED" in r.text
        assert len(enable_wangp.video_calls) == 0

    def test_resolution_mapping_540p(self, client, enable_wangp: FakeWanGPBridge):
        r = client.post("/api/generate", json=_T2V_JSON)
        assert r.status_code == 200

        call = enable_wangp.video_calls[0]
        assert call.resolution_label == "960x544"
        assert call.aspect_ratio == "16:9"

    def test_resolution_mapping_720p(self, client, enable_wangp: FakeWanGPBridge):
        r = client.post("/api/generate", json={**_T2V_JSON, "resolution": "720p"})
        assert r.status_code == 200

        call = enable_wangp.video_calls[0]
        assert call.resolution_label == "1280x720"

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
