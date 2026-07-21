"""Opt-in compatibility alarm for pinned WanGP ACE-Step schemas."""

from __future__ import annotations

import os
from pathlib import Path
from typing import cast

import pytest

from tools.inspect_wangp_music_models import MODEL_TYPES, inspect_models

pytestmark = [
    pytest.mark.wangp_integration,
    pytest.mark.skipif(
        os.environ.get("AIVS_RUN_WANGP_INTEGRATION") != "1",
        reason="set AIVS_RUN_WANGP_INTEGRATION=1 for real WanGP schema checks",
    ),
]


def test_curated_ace_step_models_match_pinned_wangp_schema() -> None:
    root = Path(__file__).resolve().parents[2] / "Wan2GP"
    records, _snapshots = inspect_models(root)
    by_id = {str(record["modelType"]): record for record in records}

    assert set(by_id) == set(MODEL_TYPES)
    for model_type in MODEL_TYPES:
        record = by_id[model_type]
        assert record["available"] is True
        assert record["audioOnly"] is True
        assert record["architecture"] in {"ace_step_v1_5", "ace_step_v1_5_xl"}
        duration = record["duration"]
        assert isinstance(duration, dict)
        duration_values = cast(dict[str, object], duration)
        assert duration_values["min"] == 5
        assert duration_values["max"] == 360
        custom_settings = record["customSettings"]
        assert isinstance(custom_settings, list)
        settings = cast(list[dict[str, object]], custom_settings)
        assert {setting["id"] for setting in settings} >= {
            "bpm",
            "keyscale",
            "timesignature",
        }
        defaults = record["defaultSettings"]
        assert isinstance(defaults, dict)
        default_values = cast(dict[str, object], defaults)
        assert default_values["num_inference_steps"] == 8
