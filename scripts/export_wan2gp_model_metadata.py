#!/usr/bin/env python3

"""
Export full WanGP/Wan2GP model metadata to individual JSON files.

Fixes:
- Handles function objects like guide_inpaint_color by converting them to strings.
- Handles other non-JSON objects more safely.
- Writes files atomically so failed serialisation cannot leave half-written JSON.
- Outputs files in the same style as WanGP's full schema export:

    {
      "ltx2_22B_nvfp4": {
        "model_type": "ltx2_22B_nvfp4",
        "name": "...",
        "model_def": {...},
        "metadata": {...},
        "setting_values": {...},
        "default_settings": {...}
      }
    }

Output folder:

    wan2gp-full-model-metadata/
"""

import argparse
import dataclasses
import inspect
import json
import math
import os
import re
import sys
from collections.abc import Mapping, Sequence
from enum import Enum
from pathlib import Path
from types import ModuleType, SimpleNamespace
from typing import Any


OUTPUT_FOLDER_NAME = "wan2gp-full-model-metadata"


def safe_filename(name: str) -> str:
    name = str(name).strip()
    name = re.sub(r'[<>:"/\\|?*\n\r\t]', "_", name)
    name = re.sub(r"_+", "_", name)
    return name or "unnamed_model"


def get_model_type(model_def: Mapping[str, Any]) -> str | None:
    return (
        model_def.get("model_type")
        or model_def.get("metadata", {}).get("model_type")
        or model_def.get("name")
    )


def describe_callable(value: Any) -> str:
    """
    Match the style produced by default=str / repr(function), e.g.

        <function ltx2_guide_inpaint_color at 0x00000144BED54540>

    This keeps the exported metadata close to WanGP's own full JSON-style output.
    """
    return str(value)


def json_safe(
    value: Any,
    *,
    path: str = "$",
    notes: list[dict[str, str]] | None = None,
    stack: set[int] | None = None,
) -> Any:
    """
    Recursively convert Python objects into JSON-safe values.

    The important bit for your failing models is callable/function handling.
    WanGP model definitions can contain things like:

        guide_inpaint_color: <function ...>

    json.dump cannot serialise those directly, so we stringify them.
    """
    if notes is None:
        notes = []

    if stack is None:
        stack = set()

    # Already JSON-safe primitives.
    if value is None or isinstance(value, bool) or isinstance(value, str) or isinstance(value, int):
        return value

    if isinstance(value, float):
        if math.isfinite(value):
            return value

        notes.append(
            {
                "path": path,
                "type": type(value).__name__,
                "converted_to": str(value),
                "reason": "Non-finite float is not strict JSON.",
            }
        )
        return str(value)

    # Common useful conversions.
    if isinstance(value, Path):
        return str(value)

    if isinstance(value, Enum):
        return json_safe(value.value, path=path, notes=notes, stack=stack)

    # Functions, methods, classes, callable objects.
    if (
        inspect.isfunction(value)
        or inspect.ismethod(value)
        or inspect.isbuiltin(value)
        or inspect.isclass(value)
        or callable(value)
    ):
        converted = describe_callable(value)
        notes.append(
            {
                "path": path,
                "type": type(value).__name__,
                "converted_to": converted,
                "reason": "Callable/function object is not JSON serializable.",
            }
        )
        return converted

    if isinstance(value, ModuleType):
        converted = f"<module {value.__name__}>"
        notes.append(
            {
                "path": path,
                "type": type(value).__name__,
                "converted_to": converted,
                "reason": "Module object is not JSON serializable.",
            }
        )
        return converted

    # Optional numpy support, without requiring numpy to be installed.
    try:
        import numpy as np  # type: ignore

        if isinstance(value, np.generic):
            return value.item()

        if isinstance(value, np.ndarray):
            notes.append(
                {
                    "path": path,
                    "type": type(value).__name__,
                    "converted_to": "list",
                    "reason": "NumPy array converted to list.",
                }
            )
            return value.tolist()

    except Exception:
        pass

    # Dataclasses.
    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        return json_safe(dataclasses.asdict(value), path=path, notes=notes, stack=stack)

    # Pydantic v2-style models.
    if hasattr(value, "model_dump") and callable(getattr(value, "model_dump")):
        try:
            return json_safe(value.model_dump(), path=path, notes=notes, stack=stack)
        except Exception:
            pass

    # Pydantic v1-style models.
    if hasattr(value, "dict") and callable(getattr(value, "dict")):
        try:
            return json_safe(value.dict(), path=path, notes=notes, stack=stack)
        except Exception:
            pass

    # SimpleNamespace.
    if isinstance(value, SimpleNamespace):
        return json_safe(vars(value), path=path, notes=notes, stack=stack)

    # Avoid circular references in containers/objects.
    value_id = id(value)

    if isinstance(value, Mapping):
        if value_id in stack:
            converted = f"<circular reference: {type(value).__name__}>"
            notes.append(
                {
                    "path": path,
                    "type": type(value).__name__,
                    "converted_to": converted,
                    "reason": "Circular reference detected.",
                }
            )
            return converted

        stack.add(value_id)

        result = {}
        for key, child_value in value.items():
            safe_key = str(key)
            result[safe_key] = json_safe(
                child_value,
                path=f"{path}.{safe_key}",
                notes=notes,
                stack=stack,
            )

        stack.remove(value_id)
        return result

    if isinstance(value, set):
        if value_id in stack:
            converted = f"<circular reference: {type(value).__name__}>"
            notes.append(
                {
                    "path": path,
                    "type": type(value).__name__,
                    "converted_to": converted,
                    "reason": "Circular reference detected.",
                }
            )
            return converted

        stack.add(value_id)

        result = [
            json_safe(item, path=f"{path}[]", notes=notes, stack=stack)
            for item in sorted(value, key=lambda x: repr(x))
        ]

        stack.remove(value_id)
        return result

    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        if value_id in stack:
            converted = f"<circular reference: {type(value).__name__}>"
            notes.append(
                {
                    "path": path,
                    "type": type(value).__name__,
                    "converted_to": converted,
                    "reason": "Circular reference detected.",
                }
            )
            return converted

        stack.add(value_id)

        result = [
            json_safe(item, path=f"{path}[{index}]", notes=notes, stack=stack)
            for index, item in enumerate(value)
        ]

        stack.remove(value_id)
        return result

    if isinstance(value, (bytes, bytearray)):
        converted = value.decode("utf-8", errors="replace")
        notes.append(
            {
                "path": path,
                "type": type(value).__name__,
                "converted_to": "utf-8 string",
                "reason": "Bytes are not JSON serializable.",
            }
        )
        return converted

    # Object fallback.
    if hasattr(value, "__dict__"):
        if value_id in stack:
            converted = f"<circular reference: {type(value).__name__}>"
            notes.append(
                {
                    "path": path,
                    "type": type(value).__name__,
                    "converted_to": converted,
                    "reason": "Circular reference detected.",
                }
            )
            return converted

        stack.add(value_id)

        try:
            result = json_safe(vars(value), path=path, notes=notes, stack=stack)
            stack.remove(value_id)
            return result
        except Exception:
            stack.remove(value_id)

    # Last-resort conversion.
    converted = str(value)
    notes.append(
        {
            "path": path,
            "type": type(value).__name__,
            "converted_to": converted,
            "reason": "Fallback string conversion.",
        }
    )
    return converted


def atomic_write_json(path: Path, data: Any, indent: int = 2) -> list[dict[str, str]]:
    """
    Convert to JSON-safe data, serialise fully in memory, then atomically replace the file.

    This prevents corrupt/partial JSON files like:

        "guide_inpaint_color":

    being left behind if serialisation fails midway.
    """
    notes: list[dict[str, str]] = []

    safe_data = json_safe(data, notes=notes)

    json_text = json.dumps(
        safe_data,
        indent=indent,
        ensure_ascii=False,
        sort_keys=False,
        allow_nan=False,
    )

    path.parent.mkdir(parents=True, exist_ok=True)

    temp_path = path.with_suffix(path.suffix + ".tmp")

    with temp_path.open("w", encoding="utf-8", newline="\n") as f:
        f.write(json_text)
        f.write("\n")

    os.replace(temp_path, path)

    return notes


def import_wangp_api(wangp_root: Path):
    wangp_root = wangp_root.resolve()

    if not wangp_root.exists():
        raise FileNotFoundError(f"WanGP root does not exist: {wangp_root}")

    shared_api = wangp_root / "shared" / "api.py"

    if not shared_api.exists():
        raise FileNotFoundError(
            f"Could not find shared/api.py under: {wangp_root}\n"
            "Make sure --wangp-root points to your WanGP installation folder."
        )

    sys.path.insert(0, str(wangp_root))

    try:
        from shared.api import init
    except Exception as exc:
        raise RuntimeError(
            "Failed to import WanGP API from shared.api.\n"
            "Run this script inside your WanGP Python environment, or pass the correct --wangp-root."
        ) from exc

    return init


def try_call(method_owner: Any, method_name: str, *args, **kwargs) -> Any:
    method = getattr(method_owner, method_name, None)

    if method is None or not callable(method):
        return None

    try:
        return method(*args, **kwargs)
    except Exception:
        return None


def build_full_model_payload(
    session: Any,
    model_type: str,
    model_def: dict[str, Any],
    include_availability: bool = False,
) -> dict[str, Any]:
    """
    Build a payload matching the 'full' style:

        {
          "model_type_here": {
            ...
          }
        }
    """
    schema = try_call(session, "get_model_schema", model_type)

    if not isinstance(schema, dict):
        schema = {
            "model_type": model_type,
            "name": model_def.get("name"),
            "model_def": model_def,
        }

    # Make sure key pieces are present even if get_model_schema is partial.
    schema.setdefault("model_type", model_type)

    if "model_def" not in schema:
        schema["model_def"] = model_def

    if "metadata" not in schema:
        metadata = try_call(session, "get_model_metadata", model_type)
        if metadata is None:
            metadata = model_def.get("metadata")
        if metadata is not None:
            schema["metadata"] = metadata

    if "setting_values" not in schema:
        metadata = schema.get("metadata")
        if isinstance(metadata, dict) and "setting_values" in metadata:
            schema["setting_values"] = metadata["setting_values"]

    if "default_settings" not in schema:
        default_settings = try_call(session, "get_default_settings", model_type)
        if default_settings is not None:
            schema["default_settings"] = default_settings

    if include_availability:
        availability = try_call(session, "get_model_availability", model_type)
        if availability is not None:
            schema["availability"] = availability

    return {model_type: schema}


def export_model_metadata(
    wangp_root: Path,
    output_dir: Path,
    include_availability: bool = False,
    cli_args: list[str] | None = None,
    indent: int = 2,
) -> None:
    init = import_wangp_api(wangp_root)

    print(f"Initialising WanGP API from: {wangp_root.resolve()}")

    session = init(
        root=wangp_root.resolve(),
        cli_args=cli_args or [],
        console_output=False,
        console_isatty=False,
    )

    output_dir.mkdir(parents=True, exist_ok=True)

    print("Collecting model definitions...")

    model_defs = session.list_model_defs()

    if not model_defs:
        print("No models found.")
        return

    exported: list[dict[str, Any]] = []
    failed: list[dict[str, Any]] = []
    all_serialisation_notes: dict[str, list[dict[str, str]]] = {}

    for model_def in model_defs:
        model_type = get_model_type(model_def)

        if not model_type:
            failed.append(
                {
                    "reason": "Could not determine model_type",
                    "model_def_preview": str(model_def)[:1000],
                }
            )
            continue

        print(f"Exporting: {model_type}")

        try:
            payload = build_full_model_payload(
                session=session,
                model_type=model_type,
                model_def=model_def,
                include_availability=include_availability,
            )

            output_path = output_dir / f"{safe_filename(model_type)}.json"

            notes = atomic_write_json(
                output_path,
                payload,
                indent=indent,
            )

            if notes:
                all_serialisation_notes[model_type] = notes

            exported.append(
                {
                    "model_type": model_type,
                    "file": str(output_path),
                    "serialisation_notes_count": len(notes),
                }
            )

        except Exception as exc:
            failed.append(
                {
                    "model_type": model_type,
                    "error": repr(exc),
                }
            )

    index_path = output_dir / "_index.json"

    atomic_write_json(
        index_path,
        {
            "exported_count": len(exported),
            "failed_count": len(failed),
            "output_dir": str(output_dir),
            "include_availability": include_availability,
            "exported": exported,
            "failed": failed,
        },
        indent=indent,
    )

    if all_serialisation_notes:
        notes_path = output_dir / "_serialisation_notes.json"

        atomic_write_json(
            notes_path,
            all_serialisation_notes,
            indent=indent,
        )

    print()
    print(f"Done. Exported {len(exported)} model metadata files.")
    print(f"Output folder: {output_dir}")
    print(f"Index file: {index_path}")

    if all_serialisation_notes:
        print(f"Serialisation notes: {output_dir / '_serialisation_notes.json'}")

    if failed:
        print(f"Warning: {len(failed)} models failed. See _index.json for details.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export full WanGP/Wan2GP model metadata to individual JSON files."
    )

    parser.add_argument(
        "--wangp-root",
        default=".",
        help="Path to your WanGP installation folder. Default: current directory.",
    )

    parser.add_argument(
        "-o",
        "--output-dir",
        default=OUTPUT_FOLDER_NAME,
        help=f"Output folder. Default: {OUTPUT_FOLDER_NAME}",
    )

    parser.add_argument(
        "--include-availability",
        action="store_true",
        help=(
            "Also include local model file availability. "
            "This performs the same kind of filesystem scan as the WanGP UI status indicators."
        ),
    )

    parser.add_argument(
        "--cli-arg",
        action="append",
        default=[],
        help=(
            "Optional WanGP CLI arg to pass through to init. "
            "Can be used multiple times. "
            "For args beginning with --, use equals syntax, e.g. --cli-arg=--attention --cli-arg=sdpa"
        ),
    )

    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="JSON indent level. Default: 2",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_args()

    export_model_metadata(
        wangp_root=Path(args.wangp_root),
        output_dir=Path(args.output_dir),
        include_availability=args.include_availability,
        cli_args=args.cli_arg,
        indent=args.indent,
    )


if __name__ == "__main__":
    main()