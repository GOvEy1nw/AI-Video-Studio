"""Print compact ACE-Step schema metadata from the bundled WanGP revision."""

from __future__ import annotations

import argparse
import importlib
import json
import os
import sys
from pathlib import Path
from typing import Any, cast

MODEL_TYPES = (
    "ace_step_v1_5_turbo_lm_1_7b",
    "ace_step_v1_5_xl_turbo_lm_1_7b",
)


def inspect_models(
    wangp_root: Path,
    *,
    config_path: Path | None = None,
    output_dir: Path | None = None,
) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    root = wangp_root.resolve()
    previous_cwd = Path.cwd()
    sys.path.insert(0, str(root))
    try:
        os.chdir(root)
        api = importlib.import_module("shared.api")
        session = api.WanGPSession(
            root=root,
            config_path=(config_path or root / "wgp_config.json").resolve(),
            output_dir=(output_dir or root / "outputs").resolve(),
            console_output=False,
        )
        records: list[dict[str, object]] = []
        snapshots: list[dict[str, object]] = []
        for model_type in MODEL_TYPES:
            schema = cast(dict[str, Any] | None, session.get_model_schema(model_type))
            if schema is None:
                records.append({"modelType": model_type, "available": False})
                continue
            model_def = cast(dict[str, Any], schema["model_def"])
            metadata = cast(dict[str, Any], schema["metadata"])
            defaults = cast(dict[str, Any], schema["default_settings"])
            availability = cast(dict[str, Any], session.get_model_availability(model_type))
            snapshots.append(
                {"schema": schema, "availability": availability}
            )
            records.append(
                {
                    "modelType": model_type,
                    "available": True,
                    "architecture": model_def.get("architecture")
                    or metadata.get("architecture"),
                    "family": metadata.get("family"),
                    "familyLabel": metadata.get("family_label"),
                    "baseModelType": metadata.get("base_model_type"),
                    "finetune": metadata.get("finetune"),
                    "audioOnly": model_def.get("audio_only"),
                    "mainOutput": metadata.get("main_output")
                    or model_def.get("main_output"),
                    "outputs": metadata.get("outputs"),
                    "inputs": metadata.get("inputs"),
                    "mediaInputs": metadata.get("media_inputs"),
                    "capabilities": metadata.get("capabilities"),
                    "duration": model_def.get("duration_slider"),
                    "customSettings": model_def.get("custom_settings"),
                    "modelModes": model_def.get("model_modes"),
                    "promptEnhancer": model_def.get("prompt_enhancer_button_label"),
                    "defaultSettings": {
                        key: defaults.get(key)
                        for key in (
                            "audio_prompt_type",
                            "duration_seconds",
                            "num_inference_steps",
                            "repeat_generation",
                        )
                    },
                    "availability": availability,
                }
            )
        return records, snapshots
    finally:
        os.chdir(previous_cwd)
        sys.path.remove(str(root))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--wangp-root",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "Wan2GP",
    )
    parser.add_argument("--config", type=Path)
    parser.add_argument("--outputs-dir", type=Path)
    parser.add_argument("--snapshot", type=Path)
    args = parser.parse_args()
    records, snapshots = inspect_models(
        args.wangp_root,
        config_path=args.config,
        output_dir=args.outputs_dir,
    )
    payload = json.dumps(records, indent=2, default=str)
    print(payload)
    if args.snapshot is not None:
        args.snapshot.write_text(
            json.dumps(snapshots, indent=2, default=str) + "\n",
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
