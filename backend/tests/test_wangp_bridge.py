from __future__ import annotations

import json
import sys
import os
from collections import deque
from pathlib import Path
from types import SimpleNamespace

from services.wangp_bridge import WanGPBridge


def _capture_progress_event(data: object) -> tuple[object, ...]:
    captured: list[tuple[object, ...]] = []
    _make_bridge()._handle_event(
        SimpleNamespace(kind="progress", data=data),
        lambda *args: captured.append(args),
        deque(),
        {"phase": "", "progress": -1, "logged_at": 0.0},
    )
    return captured[-1]


def test_structured_model_download_preserves_exact_transfer_progress() -> None:
    args = _capture_progress_event(
        SimpleNamespace(
            phase="downloading_model",
            progress=10,
            current_step=6_895_321_088,
            total_steps=12_992_123_904,
            unit="bytes",
            status="Downloading LTX 2.3",
            details={
                "kind": "model_download",
                "phase": "downloading",
                "model_type": "ltx2_22B_distilled_1_1",
                "model_name": "LTX 2.3 Fast",
                "source": "huggingface",
                "repo_id": "owner/repo",
                "filename": "model-00003-of-00006.safetensors",
                "speed_bps": 88_080_384.0,
                "eta_seconds": 68.0,
                "file_index": 3,
                "file_count": 6,
            },
        )
    )

    transfer = args[14]
    assert args[:4] == ("downloading_model", 10, 6_895_321_088, 12_992_123_904)
    assert args[13] == "bytes"
    assert transfer.filename == "model-00003-of-00006.safetensors"
    assert transfer.repo_id == "owner/repo"
    assert transfer.speed_bps == 88_080_384.0
    assert transfer.eta_seconds == 68.0
    assert round(transfer.percent, 1) == 53.1


def test_structured_model_download_supports_file_counts_and_unknown_totals() -> None:
    file_args = _capture_progress_event(
        SimpleNamespace(
            phase="downloading_model",
            progress=10,
            current_step=None,
            total_steps=None,
            unit="files",
            status="Downloading snapshot",
            details={
                "kind": "model_download",
                "completed_files": 3,
                "total_files": 8,
                "speed_bps": 99,
            },
        )
    )
    unknown_args = _capture_progress_event(
        SimpleNamespace(
            phase="downloading_model",
            progress=10,
            current_step=None,
            total_steps=None,
            unit="bytes",
            status="Downloading file",
            details={"kind": "model_download", "downloaded_bytes": 1234},
        )
    )

    files = file_args[14]
    unknown = unknown_args[14]
    assert (files.unit, files.current, files.total, files.percent) == ("files", 3, 8, 37.5)
    assert files.speed_bps is None
    assert (unknown.current, unknown.total, unknown.percent) == (1234, None, None)


def test_model_download_optional_details_are_defensive() -> None:
    args = _capture_progress_event(
        SimpleNamespace(
            phase="downloading_model",
            progress=10,
            current_step=5,
            total_steps=10,
            unit="bytes",
            status="Downloading model",
            details={
                "kind": "model_download",
                "speed_bps": float("nan"),
                "eta_seconds": -1,
                "file_index": "bad",
            },
        )
    )

    transfer = args[14]
    assert transfer.speed_bps is None
    assert transfer.eta_seconds is None
    assert transfer.file_index is None


def test_model_lifecycle_phase_classification_is_specific() -> None:
    assert WanGPBridge._classify_phase("Checking model files for X...") == "checking_model_files"
    assert WanGPBridge._classify_phase("Downloading model X...") == "downloading_model"
    assert WanGPBridge._classify_phase("Loading model X into memory...") == "loading_model"
    assert WanGPBridge._classify_phase("Model loaded") == "loading_model"


def _make_bridge(*, image_model_type: str = "z_image") -> WanGPBridge:
    return WanGPBridge(
        enabled=True,
        root=Path(r"E:\ML\w20"),
        python_executable=None,
        config_dir=Path(r"E:\tmp\wangp_bridge"),
        output_dir=Path(r"E:\tmp\wangp_outputs"),
        video_model_type="ltx2_22B_distilled_1_1",
        image_model_type=image_model_type,
        camera_motion_prompts={},
        extra_args=(),
    )


def test_qwen_image_resolution_uses_native_16_9_preset() -> None:
    bridge = _make_bridge(image_model_type="qwen_image_20B")

    assert bridge._map_image_resolution(1920, 1072) == (1664, 928)


def test_qwen_image_resolution_falls_back_to_nearest_supported_aspect() -> None:
    bridge = _make_bridge(image_model_type="qwen_image_20B")

    assert bridge._map_image_resolution(2520, 1080) == (1664, 928)


def test_non_qwen_image_resolution_is_left_unchanged() -> None:
    bridge = _make_bridge(image_model_type="z_image")

    assert bridge._map_image_resolution(1920, 1072) == (1920, 1072)


def test_generate_music_maps_verified_wangp_settings() -> None:
    bridge = _make_bridge()
    captured: dict[str, object] = {}

    def fake_run_manifest(*, manifest, media_suffixes, on_progress, is_cancelled):  # type: ignore[no-untyped-def]
        del on_progress, is_cancelled
        captured["manifest"] = manifest
        captured["media_suffixes"] = media_suffixes
        return [r"E:\tmp\song.wav"]

    bridge._run_manifest = fake_run_manifest  # type: ignore[method-assign]

    output = bridge.generate_music(
        description="Warm cinematic ambient music",
        lyrics="[Verse]\nHello",
        duration_seconds=45,
        bpm=96,
        key_scale="A minor",
        time_signature="6/8",
        auto_fill_metadata=True,
        seed=42,
        model_type="ace_step_v1_5_turbo_lm_1_7b",
        default_settings={"num_inference_steps": 8, "duration_seconds": 99},
        on_progress=lambda *_args: None,
        is_cancelled=lambda: False,
    )

    assert output == r"E:\tmp\song.wav"
    assert captured["manifest"] == [
        {
            "id": 1,
            "params": {
                "model_type": "ace_step_v1_5_turbo_lm_1_7b",
                "prompt": "[Verse]\nHello",
                "alt_prompt": "Warm cinematic ambient music",
                "duration_seconds": 45,
                "audio_prompt_type": "",
                "repeat_generation": 1,
                "multi_prompts_gen_type": "FG",
                "num_inference_steps": 8,
                "custom_settings": {
                    "bpm": 96,
                    "keyscale": "A minor",
                    "timesignature": 6,
                },
                "model_mode": 0,
                "seed": 42,
            },
            "plugin_data": {},
        }
    ]
    assert captured["media_suffixes"] == {
        ".wav",
        ".mp3",
        ".flac",
        ".ogg",
        ".m4a",
        ".aac",
    }


def test_runtime_preferences_update_wangp_config(tmp_path: Path) -> None:
    config_path = tmp_path / "wgp_config.json"
    config_path.write_text(json.dumps({"existing": "kept"}), encoding="utf-8")
    bridge = WanGPBridge(
        enabled=True,
        root=tmp_path,
        python_executable=None,
        config_dir=tmp_path / "config",
        output_dir=tmp_path / "outputs",
        video_model_type="ltx2_22B_distilled_1_1",
        image_model_type="z_image",
        camera_motion_prompts={},
        extra_args=(),
    )

    bridge.set_runtime_preferences(
        attention_mode="sage2",
        performance_profile=4.5,
        reduce_vram="2",
    )

    saved = json.loads(config_path.read_text(encoding="utf-8"))
    assert saved["existing"] == "kept"
    assert saved["attention_mode"] == "sage2"
    assert saved["profile"] == 4.5
    assert saved["video_profile"] == 4.5
    assert saved["image_profile"] == 4.5
    assert saved["audio_profile"] == 4.5
    assert saved["vae_config"] == 2
    assert saved["boost"] == 2

    bridge.set_runtime_preferences(
        attention_mode="auto",
        performance_profile=4,
        reduce_vram="disabled",
    )

    saved = json.loads(config_path.read_text(encoding="utf-8"))
    assert saved["vae_config"] == 0
    assert saved["boost"] == 1


def test_custom_checkpoints_directory_updates_wangp_config(tmp_path: Path) -> None:
    checkpoints_dir = tmp_path / "existing-wangp" / "ckpts"
    WanGPBridge(
        enabled=True,
        root=tmp_path,
        python_executable=None,
        config_dir=tmp_path / "config",
        output_dir=tmp_path / "outputs",
        video_model_type="ltx2_22B_distilled_1_1",
        image_model_type="z_image",
        camera_motion_prompts={},
        checkpoints_dir=checkpoints_dir,
    )

    saved = json.loads((tmp_path / "config" / "wgp_config.json").read_text(encoding="utf-8"))
    assert saved["checkpoints_paths"] == [str(checkpoints_dir.resolve()), "."]


def test_custom_loras_directory_updates_wangp_config(tmp_path: Path) -> None:
    loras_dir = tmp_path / "existing-wangp" / "loras"
    WanGPBridge(
        enabled=True,
        root=tmp_path,
        python_executable=None,
        config_dir=tmp_path / "config",
        output_dir=tmp_path / "outputs",
        video_model_type="ltx2_22B_distilled_1_1",
        image_model_type="z_image",
        camera_motion_prompts={},
        loras_dir=loras_dir,
    )

    saved = json.loads((tmp_path / "config" / "wgp_config.json").read_text(encoding="utf-8"))
    assert saved["loras_root"] == str(loras_dir.resolve())


def test_z_image_uses_eight_step_floor() -> None:
    bridge = _make_bridge(image_model_type="z_image")

    assert bridge._normalize_image_steps(4) == 8
    assert bridge._normalize_image_steps(8) == 8
    assert bridge._normalize_image_steps(12) == 12


def test_ltx2_video_uses_full_video_length_as_sliding_window_size() -> None:
    bridge = _make_bridge()
    captured: dict[str, object] = {}

    def fake_run_manifest(*, manifest, media_suffixes, on_progress, is_cancelled):  # type: ignore[no-untyped-def]
        captured["settings"] = manifest[0]["params"]
        return ["E:/tmp/out.mp4"]

    bridge._run_manifest = fake_run_manifest  # type: ignore[method-assign]

    output = bridge.generate_video(
        prompt="A person walking in the rain",
        resolution_label="1080p",
        aspect_ratio="16:9",
        duration_seconds=6,
        fps=24,
        steps=8,
        seed=123,
        camera_motion="none",
        negative_prompt="",
        image_path=None,
        audio_path=None,
        on_progress=lambda *_args: None,
        is_cancelled=lambda: False,
    )

    assert output == "E:/tmp/out.mp4"
    assert captured["settings"]["video_length"] == 145
    assert captured["settings"]["sliding_window_size"] == 481


def test_generate_video_forwards_default_lora_settings() -> None:
    bridge = _make_bridge()
    captured: dict[str, object] = {}

    def fake_run_manifest(*, manifest, media_suffixes, on_progress, is_cancelled):  # type: ignore[no-untyped-def]
        captured["settings"] = manifest[0]["params"]
        return ["E:/tmp/out.mp4"]

    bridge._run_manifest = fake_run_manifest  # type: ignore[method-assign]

    bridge.generate_video(
        prompt="Shot one\n[0s:4s] Cut to shot two",
        resolution_label="720p",
        aspect_ratio="16:9",
        duration_seconds=8,
        fps=24,
        steps=8,
        seed=123,
        camera_motion="none",
        negative_prompt="",
        image_path=None,
        audio_path=None,
        on_progress=lambda *_args: None,
        is_cancelled=lambda: False,
        default_settings={
            "activated_loras": ["LTX-2.3_Cinematic_hardcut.safetensors"],
            "loras_multipliers": "1.0",
        },
    )

    assert captured["settings"]["activated_loras"] == ["LTX-2.3_Cinematic_hardcut.safetensors"]
    assert captured["settings"]["loras_multipliers"] == "1.0"


def test_generate_video_forwards_outpainting_settings() -> None:
    bridge = _make_bridge()
    captured: dict[str, object] = {}

    def fake_run_manifest(*, manifest, media_suffixes, on_progress, is_cancelled):  # type: ignore[no-untyped-def]
        captured["settings"] = manifest[0]["params"]
        return ["E:/tmp/out.mp4"]

    bridge._run_manifest = fake_run_manifest  # type: ignore[method-assign]

    bridge.generate_video(
        prompt="outpaint",
        resolution_label="540p",
        aspect_ratio="16:9",
        duration_seconds=5,
        fps=24,
        steps=8,
        seed=123,
        camera_motion="none",
        negative_prompt="",
        image_path=None,
        audio_path=None,
        on_progress=lambda *_args: None,
        is_cancelled=lambda: False,
        control_video_path="E:/tmp/guide.mp4",
        video_prompt_type="VG",
        video_guide_outpainting="35 70 40 30",
        video_guide_outpainting_ratio="",
        default_settings={
            "force_fps": "auto",
            "sliding_window_overlap": 33,
        },
    )

    settings = captured["settings"]
    assert settings["multi_prompts_gen_type"] == "FG"
    assert settings["force_fps"] == "auto"
    assert settings["sliding_window_overlap"] == 33
    assert settings["video_guide_outpainting"] == "35 70 40 30"
    assert settings["video_guide_outpainting_ratio"] == ""
    assert settings["video_prompt_type"] == "VG"


def test_generate_video_uses_source_frame_count_for_video_length() -> None:
    bridge = _make_bridge()
    captured: dict[str, object] = {}

    def fake_run_manifest(*, manifest, media_suffixes, on_progress, is_cancelled):  # type: ignore[no-untyped-def]
        captured["settings"] = manifest[0]["params"]
        return ["E:/tmp/out.mp4"]

    bridge._run_manifest = fake_run_manifest  # type: ignore[method-assign]

    bridge.generate_video(
        prompt="outpaint",
        resolution_label="540p",
        aspect_ratio="16:9",
        duration_seconds=5,
        fps=24,
        steps=8,
        seed=123,
        camera_motion="none",
        negative_prompt="",
        image_path=None,
        audio_path=None,
        on_progress=lambda *_args: None,
        is_cancelled=lambda: False,
        control_video_path="E:/tmp/guide.mp4",
        video_length_frames=150,
    )

    assert captured["settings"]["force_fps"] == 24
    assert captured["settings"]["video_length"] == 145


def test_generate_director_video_submits_exact_backend_settings() -> None:
    bridge = _make_bridge()
    captured: dict[str, object] = {}

    def fake_run_manifest(*, manifest, media_suffixes, on_progress, is_cancelled):  # type: ignore[no-untyped-def]
        captured["manifest"] = manifest
        return ["E:/tmp/director.mp4"]

    bridge._run_manifest = fake_run_manifest  # type: ignore[method-assign]
    settings: dict[str, object] = {
        "model_type": "ltx2_22B_distilled_1_1",
        "prompt": "[1:61] walk",
        "multi_prompts_gen_type": "FG",
        "video_prompt_type": "KFI",
        "image_refs": ["E:/tmp/one.png", "E:/tmp/two.png"],
        "frames_positions": "1 61",
        "video_length": 121,
    }

    output = bridge.generate_director_video(
        settings=settings,
        on_progress=lambda *_args: None,
        is_cancelled=lambda: False,
    )

    assert output == "E:/tmp/director.mp4"
    assert captured["manifest"] == [{"id": 1, "params": settings, "plugin_data": {}}]


def test_select_final_output_prefers_newest_combined_file(tmp_path: Path) -> None:
    first = tmp_path / "2026-07-09-15h41m19s_seed1783608007_outpaint.mp4"
    combined = tmp_path / "2026-07-09-15h42m23s_seed1783608007_outpaint.mp4"
    final = tmp_path / "2026-07-09-15h43m31s_seed1783608007_outpaint.mp4"
    for index, path in enumerate([first, combined, final], start=1):
        path.write_bytes(f"segment-{index}".encode("utf-8"))
        os.utime(path, (1_700_000_000 + index, 1_700_000_000 + index))

    assert WanGPBridge._select_final_output([str(first), str(combined), str(final)]) == str(final)


def test_bridge_prefers_root_wgp_config_when_present(tmp_path: Path) -> None:
    root = tmp_path / "wangp-root"
    root.mkdir()
    root_config = root / "wgp_config.json"
    root_config.write_text("{}", encoding="utf-8")

    bridge = WanGPBridge(
        enabled=True,
        root=root,
        python_executable=None,
        config_dir=tmp_path / "wangp_bridge",
        output_dir=tmp_path / "wangp_outputs",
        video_model_type="ltx2_22B_distilled_1_1",
        image_model_type="z_image",
        camera_motion_prompts={},
        extra_args=(),
    )

    assert bridge._resolve_session_config_path() == root_config


def test_bridge_falls_back_to_bridge_config_when_root_config_missing(tmp_path: Path) -> None:
    root = tmp_path / "wangp-root"
    root.mkdir()
    config_dir = tmp_path / "wangp_bridge"

    bridge = WanGPBridge(
        enabled=True,
        root=root,
        python_executable=None,
        config_dir=config_dir,
        output_dir=tmp_path / "wangp_outputs",
        video_model_type="ltx2_22B_distilled_1_1",
        image_model_type="z_image",
        camera_motion_prompts={},
        extra_args=(),
    )

    assert bridge._resolve_session_config_path() == config_dir / "wgp_config.json"


def test_preload_session_ensures_runtime_without_direct_model_load(tmp_path: Path) -> None:
    root = tmp_path / "wangp-root"
    shared = root / "shared"
    output_dir = tmp_path / "outputs"
    shared.mkdir(parents=True)
    (shared / "__init__.py").write_text("", encoding="utf-8")
    (root / "wgp.py").write_text(
        """
from pathlib import Path

def load_models(*args, **kwargs):
    Path(__file__).with_name("load_models_called").write_text("called", encoding="utf-8")
""",
        encoding="utf-8",
    )
    (shared / "api.py").write_text(
        """
import importlib
from pathlib import Path

class WanGPSession:
    def __init__(self, *, root, config_path, output_dir, cli_args):
        self.output_dir = Path(output_dir)
        importlib.import_module("wgp")

    def ensure_ready(self):
        self.output_dir.mkdir(parents=True, exist_ok=True)
        (self.output_dir / "ensure_ready_called").write_text("called", encoding="utf-8")
""",
        encoding="utf-8",
    )

    saved_path = list(sys.path)
    saved_modules = {name: sys.modules.get(name) for name in ("shared", "shared.api", "wgp")}
    for name in saved_modules:
        sys.modules.pop(name, None)

    try:
        bridge = WanGPBridge(
            enabled=True,
            root=root,
            python_executable=None,
            config_dir=tmp_path / "wangp_bridge",
            output_dir=output_dir,
            video_model_type="ltx2_22B_distilled_1_1",
            image_model_type="z_image",
            camera_motion_prompts={},
                extra_args=(),
        )

        bridge.preload_session()

        assert (output_dir / "ensure_ready_called").exists()
        assert not (root / "load_models_called").exists()
    finally:
        sys.path[:] = saved_path
        for name, module in saved_modules.items():
            if module is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = module
