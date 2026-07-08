"""Fake WanGP bridge for tests.

Mirrors the public surface of ``services.wangp_bridge.WanGPBridge`` that the
generation handlers actually call — ``generate_video``, ``generate_images``
and ``get_status`` — without touching the real WanGP runtime. Each call
writes a placeholder output file into the configured output directory so
the response payloads point at real on-disk paths, matching the live
bridge's contract.
"""

from __future__ import annotations

import uuid
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from pathlib import Path

from services.wangp_bridge import ProgressCallback, WanGPBridgeStatus


@dataclass
class FakeWangpVideoCall:
    prompt: str
    resolution_label: str
    aspect_ratio: str
    duration_seconds: int
    fps: int
    steps: int
    seed: int | None
    camera_motion: str
    negative_prompt: str
    image_path: str | None
    audio_path: str | None
    model_type: str
    default_settings: dict[str, object]
    start_image_path: str | None = None
    end_image_path: str | None = None
    control_video_path: str | None = None
    video_prompt_type: str | None = None
    image_prompt_type: str | None = None
    audio_prompt_type: str | None = None


@dataclass
class FakeWangpImageCall:
    prompt: str
    width: int
    height: int
    num_steps: int
    num_images: int
    seed: int | None
    model_type: str
    default_settings: dict[str, object]


@dataclass
class FakeWangpEnhancePromptCall:
    prompt: str
    mode: str
    model_type: str
    image_path: str | None


@dataclass
class FakeWanGPBridge:
    """Test stand-in for ``WanGPBridge``.

    Defaults to an available bridge; tests can flip ``available`` or set
    ``raise_on_generate``/``raise_on_video`` to exercise error and
    cancellation paths. The ``image_model_type``/``video_model_type``
    fields mirror the real constructor signature so the bridge can be
    wired through ``AppHandler`` unchanged.
    """

    enabled: bool = True
    root: Path | None = field(default_factory=lambda: Path(__file__).resolve().parent)
    python_executable: str | None = None
    config_dir: Path = field(default_factory=lambda: Path("."))
    output_dir: Path = field(default_factory=lambda: Path("."))
    video_model_type: str = "ltx2_22B_distilled_1_1"
    image_model_type: str = "z_image"
    camera_motion_prompts: dict[str, str] = field(default_factory=dict)
    extra_args: Iterable[str] = ()
    available: bool = True
    unavailable_reason: str | None = "WanGP bridge disabled in test"
    session_ready: bool = False
    preload_calls: int = 0

    video_calls: list[FakeWangpVideoCall] = field(default_factory=list)
    image_calls: list[FakeWangpImageCall] = field(default_factory=list)
    enhance_prompt_calls: list[FakeWangpEnhancePromptCall] = field(default_factory=list)
    raise_on_video: Exception | None = None
    raise_on_images: Exception | None = None
    raise_on_enhance_prompt: Exception | None = None

    def get_status(self) -> WanGPBridgeStatus:
        return WanGPBridgeStatus(
            available=self.enabled and self.available,
            root=self.root,
            python_executable=self.python_executable,
            reason=None if (self.enabled and self.available) else (self.unavailable_reason or "WanGP bridge is unavailable"),
            session_ready=self.session_ready,
        )

    def preload_session(self) -> None:
        self.preload_calls += 1
        if not self.enabled:
            return
        if not self.available:
            raise RuntimeError(self.unavailable_reason or "WanGP bridge is unavailable")
        self.session_ready = True

    def generate_video(
        self,
        *,
        prompt: str,
        resolution_label: str,
        aspect_ratio: str,
        duration_seconds: int,
        fps: int,
        steps: int,
        seed: int | None,
        camera_motion: str,
        negative_prompt: str,
        image_path: str | None,
        audio_path: str | None,
        on_progress: ProgressCallback,
        is_cancelled: Callable[[], bool],
        model_type: str | None = None,
        default_settings: dict[str, object] | None = None,
        start_image_path: str | None = None,
        end_image_path: str | None = None,
        control_video_path: str | None = None,
        video_prompt_type: str | None = None,
        image_prompt_type: str | None = None,
        audio_prompt_type: str | None = None,
    ) -> str:
        self.video_calls.append(
            FakeWangpVideoCall(
                prompt=prompt,
                resolution_label=resolution_label,
                aspect_ratio=aspect_ratio,
                duration_seconds=duration_seconds,
                fps=fps,
                steps=steps,
                seed=seed,
                camera_motion=camera_motion,
                negative_prompt=negative_prompt,
                image_path=image_path,
                audio_path=audio_path,
                model_type=model_type if model_type is not None else self.video_model_type,
                default_settings=dict(default_settings) if default_settings else {},
                start_image_path=start_image_path,
                end_image_path=end_image_path,
                control_video_path=control_video_path,
                video_prompt_type=video_prompt_type,
                image_prompt_type=image_prompt_type,
                audio_prompt_type=audio_prompt_type,
            )
        )
        if self.raise_on_video is not None:
            raise self.raise_on_video
        self.output_dir.mkdir(parents=True, exist_ok=True)
        output_path = self.output_dir / f"fake_wangp_video_{uuid.uuid4().hex[:8]}.mp4"
        output_path.write_bytes(b"fake-wangp-video")
        return str(output_path)

    def generate_images(
        self,
        *,
        prompt: str,
        width: int,
        height: int,
        num_steps: int,
        num_images: int,
        seed: int | None,
        on_progress: ProgressCallback,
        is_cancelled: Callable[[], bool],
        model_type: str | None = None,
        default_settings: dict[str, object] | None = None,
    ) -> list[str]:
        self.image_calls.append(
            FakeWangpImageCall(
                prompt=prompt,
                width=width,
                height=height,
                num_steps=num_steps,
                num_images=num_images,
                seed=seed,
                model_type=model_type if model_type is not None else self.image_model_type,
                default_settings=dict(default_settings) if default_settings else {},
            )
        )
        if self.raise_on_images is not None:
            raise self.raise_on_images
        self.output_dir.mkdir(parents=True, exist_ok=True)
        outputs: list[str] = []
        for _ in range(max(1, num_images)):
            image_path = self.output_dir / f"fake_wangp_image_{uuid.uuid4().hex[:8]}.png"
            image_path.write_bytes(b"fake-wangp-image")
            outputs.append(str(image_path))
        return outputs

    def enhance_prompt(
        self,
        *,
        prompt: str,
        mode: str,
        model_type: str,
        image_path: str | None = None,
    ) -> str:
        self.enhance_prompt_calls.append(
            FakeWangpEnhancePromptCall(
                prompt=prompt,
                mode=mode,
                model_type=model_type,
                image_path=image_path,
            )
        )
        if self.raise_on_enhance_prompt is not None:
            raise self.raise_on_enhance_prompt
        return f"enhanced: {prompt}"

    @staticmethod
    def compute_num_frames(duration_seconds: int, fps: int) -> int:
        return max(((duration_seconds * fps) // 8) * 8 + 1, 9)


def build_fake_wangp_bridge(
    *,
    output_dir: Path,
    image_model_type: str = "z_image",
    video_model_type: str = "ltx2_22B_distilled_1_1",
) -> FakeWanGPBridge:
    """Construct a default-available fake bridge bound to ``output_dir``."""
    return FakeWanGPBridge(
        enabled=True,
        available=True,
        root=None,
        python_executable=None,
        config_dir=output_dir,
        output_dir=output_dir,
        video_model_type=video_model_type,
        image_model_type=image_model_type,
        camera_motion_prompts={},
        extra_args=(),
    )
