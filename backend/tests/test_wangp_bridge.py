from __future__ import annotations

import sys
from pathlib import Path

from services.wangp_bridge import WanGPBridge


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
    assert captured["settings"]["sliding_window_size"] == 145


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
        video_prompt_type="VG|",
        video_guide_outpainting="35 70 40 30",
        video_guide_outpainting_ratio="",
    )

    settings = captured["settings"]
    assert settings["video_guide_outpainting"] == "35 70 40 30"
    assert settings["video_guide_outpainting_ratio"] == ""
    assert settings["video_prompt_type"] == "VG|"


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
