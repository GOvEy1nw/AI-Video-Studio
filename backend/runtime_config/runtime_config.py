"""Runtime configuration model."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import torch

@dataclass
class RuntimeConfig:
    device: torch.device
    outputs_dir: Path
    settings_file: Path
    use_sage_attention: bool
    camera_motion_prompts: dict[str, str]
    default_negative_prompt: str
    wangp_enabled: bool
    wangp_root: Path | None
    wangp_python: str | None
    wangp_config_dir: Path
    wangp_video_model_type: str
    wangp_image_model_type: str
    wangp_extra_args: tuple[str, ...]
    wangp_checkpoints_dir: Path | None = None
    wangp_loras_dir: Path | None = None

