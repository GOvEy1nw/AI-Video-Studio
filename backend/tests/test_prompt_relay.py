from __future__ import annotations

import importlib.util
import math
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
import torch


def _load_prompt_relay_module():
    module_path = Path(__file__).parents[2] / "Wan2GP" / "shared" / "prompt_relay.py"
    spec = importlib.util.spec_from_file_location("wangp_prompt_relay_for_tests", module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


PROMPT_RELAY = _load_prompt_relay_module()
WANGP_ROOT = Path(__file__).parents[2] / "Wan2GP"


class _Tokenizer:
    eos_token_id = None
    model_max_length = 1024

    def __call__(self, text: str, **_kwargs: object) -> dict[str, list[int]]:
        return {"input_ids": list(range(len(text.split())))}


class _TextEncoderCache:
    def encode(self, *_args: object, **_kwargs: object) -> list[tuple[torch.Tensor, None, torch.Tensor, torch.Tensor]]:
        context = torch.zeros((1, 3, 4))
        mask = torch.ones((1, 3), dtype=torch.bool)
        return [(context, None, mask, mask)]


def _build_mask(epsilon: float) -> torch.Tensor:
    segments = [
        PROMPT_RELAY._RuntimeSegment(index / 5, (index + 1) / 5, index * 2, (index + 1) * 2)
        for index in range(5)
    ]
    builder = PROMPT_RELAY.PromptRelayMaskBuilder(
        torch.ones(10, dtype=torch.bool),
        segments,
        10,
        epsilon=epsilon,
    )
    state = SimpleNamespace(latent=torch.zeros((1, 16, 4)))
    mask = builder(
        state,
        torch.arange(16).unsqueeze(0),
        torch.zeros((1, 10, 4)),
    )
    assert mask is not None
    return mask


def test_prompt_relay_quantizes_segments_to_query_frames() -> None:
    mask = _build_mask(0.001)
    for index in range(5):
        segment_mask = mask[0, :, 0, index * 2 : (index + 1) * 2]
        assert torch.any(segment_mask == 0)


def test_prompt_relay_epsilon_controls_falloff_softness() -> None:
    sharp_mask = _build_mask(0.0001)
    soft_mask = _build_mask(0.99)
    assert soft_mask[0, 5, 0, 0] > sharp_mask[0, 5, 0, 0]


def test_encode_prompt_relay_applies_requested_epsilon(capsys: pytest.CaptureFixture[str]) -> None:
    conditioning = PROMPT_RELAY.encode_prompt_relay(
        "global [0%:50%] first [50%:100%] second",
        lambda _prompts: [],
        _TextEncoderCache(),
        "cpu",
        16,
        24.0,
        _Tokenizer(),
        epsilon=0.5,
    )

    assert conditioning is not None
    assert conditioning.video_mask_builder is not None
    assert math.isclose(conditioning.video_mask_builder.sigma, 1.0 / math.log(2.0))
    assert "[PromptRelay] epsilon=0.5" in capsys.readouterr().out


def test_ltx2_pipelines_forward_custom_prompt_relay_epsilon() -> None:
    handler_source = (WANGP_ROOT / "models" / "ltx2" / "ltx2_handler.py").read_text(encoding="utf-8")
    assert '"id": "prompt_relay_epsilon"' in handler_source
    assert '"custom_settings": [_PROMPT_RELAY_CUSTOM_SETTING.copy()]' in handler_source

    model_source = (WANGP_ROOT / "models" / "ltx2" / "ltx2.py").read_text(encoding="utf-8")
    assert 'custom_settings.get("prompt_relay_epsilon"' in model_source
    assert model_source.count("prompt_relay_epsilon=prompt_relay_epsilon") == 2

    pipeline_dir = WANGP_ROOT / "models" / "ltx2" / "ltx_pipelines"
    for filename in ("distilled.py", "ti2vid_one_stage.py", "ti2vid_two_stages.py"):
        pipeline_source = (pipeline_dir / filename).read_text(encoding="utf-8")
        assert "prompt_relay_epsilon: float = 1e-3" in pipeline_source
        assert "epsilon=prompt_relay_epsilon" in pipeline_source
