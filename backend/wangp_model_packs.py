"""Download AiVS model packs through WanGP without loading any model on GPU."""

from __future__ import annotations

import argparse
from importlib import import_module
import json
import os
import sys
import threading
import time
import warnings
from pathlib import Path
from typing import Any, cast


PACKS: dict[str, dict[str, str]] = {
    "utility": {"name": "Utility Models", "kind": "utility"},
    "z_image_turbo": {"name": "Z-Image Turbo", "kind": "model", "model_type": "z_image"},
    "flux2_klein_4b": {"name": "Flux 2 Klein 4B", "kind": "model", "model_type": "flux2_klein_4b"},
    "krea2_turbo": {"name": "Krea 2 Turbo", "kind": "model", "model_type": "krea2_turbo"},
    "hidream_o1": {"name": "HiDream O1", "kind": "model", "model_type": "hidream_o1_dev"},
    "ltx2_turbo": {"name": "LTX 2.3 Turbo 1.1", "kind": "model", "model_type": "ltx2_22B_distilled_1_1"},
    "prompt_enhancer": {"name": "Prompt Enhancer", "kind": "prompt"},
    "ltx_lora": {"name": "LTX LoRA", "kind": "lora", "model_type": "ltx2_22B_distilled_1_1"},
}


def _event(event: str, **values: object) -> None:
    print(f"AIVS_PACK:{json.dumps({'event': event, **values})}", flush=True)


def _state_path(app_data_dir: Path) -> Path:
    return app_data_dir / "model-pack-state.json"


def _load_state(app_data_dir: Path) -> set[str]:
    try:
        return set(json.loads(_state_path(app_data_dir).read_text(encoding="utf-8")).get("completed", []))
    except (OSError, json.JSONDecodeError):
        return set()


def _save_state(app_data_dir: Path, completed: set[str]) -> None:
    path = _state_path(app_data_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"completed": sorted(completed)}, indent=2), encoding="utf-8")


class DownloadProgressMonitor:
    """Report growing WanGP checkpoint files when Hugging Face hides its TTY bar."""

    def __init__(self, root: Path) -> None:
        self._root = root / "chkpts"
        self._previous: dict[Path, int] = {}
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._watch, daemon=True)

    def start(self) -> None:
        self._previous = self._snapshot()
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        self._thread.join(timeout=2)

    def _snapshot(self) -> dict[Path, int]:
        if not self._root.is_dir():
            return {}
        files: dict[Path, int] = {}
        for file_path in self._root.rglob("*"):
            if not file_path.is_file():
                continue
            try:
                files[file_path] = file_path.stat().st_size
            except OSError:
                continue
        return files

    def _watch(self) -> None:
        last_time = time.monotonic()
        while not self._stop.wait(0.5):
            now = time.monotonic()
            current = self._snapshot()
            for file_path, size in current.items():
                previous_size = self._previous.get(file_path, 0)
                if size <= previous_size:
                    continue
                _event(
                    "transfer",
                    file=file_path.name.removesuffix(".incomplete"),
                    downloadedBytes=size,
                    speed=(size - previous_size) / max(now - last_time, 0.001),
                )
            self._previous = current
            last_time = now


def _download_pack(wgp: Any, pack_id: str) -> None:
    pack = PACKS[pack_id]
    kind = pack["kind"]
    if kind == "utility":
        wgp.process_files_def(**wgp.query_core_shared_model_files())
    elif kind == "prompt":
        assets = import_module("shared.prompt_enhancer.assets")
        definitions = cast(list[dict[str, Any]], assets.query_prompt_enhancer_download_defs())
        for definition in definitions:
            wgp.process_files_def(**definition)
    else:
        model_type = pack["model_type"]
        filename = wgp.get_model_filename(
            model_type,
            wgp.transformer_quantization,
            wgp.transformer_dtype_policy,
        )
        wgp.download_models(filename, model_type, file_type=1 if kind == "lora" else 0)


def main() -> int:
    warnings.filterwarnings("ignore", message="The pynvml package is deprecated.*", category=FutureWarning)
    parser = argparse.ArgumentParser()
    parser.add_argument("--wangp-root", required=True)
    parser.add_argument("--app-data-dir", required=True)
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--download", nargs="*")
    args = parser.parse_args()

    root = Path(args.wangp_root).resolve()
    app_data_dir = Path(args.app_data_dir).resolve()
    if not (root / "wgp.py").is_file():
        raise RuntimeError("Bundled WanGP checkout is missing wgp.py")

    completed = _load_state(app_data_dir)
    if args.list:
        _event("packs", packs=[{"id": key, "installed": key in completed} for key in PACKS])
        return 0

    requested = cast(list[str], args.download or [])
    unknown = set(requested) - set(PACKS)
    if unknown:
        raise RuntimeError(f"Unknown model packs: {', '.join(sorted(unknown))}")

    os.chdir(root)
    sys.path[:0] = [str(Path(__file__).resolve().parent), str(root)]
    # WanGP parses sys.argv during import. Keep this runner's CLI flags out of
    # that parser, otherwise it exits with argparse status 2 before a pack starts.
    runner_argv = sys.argv
    sys.argv = [sys.argv[0]]
    try:
        wgp = import_module("wgp")
    finally:
        sys.argv = runner_argv

    for pack_id in requested:
        _event("pack-start", id=pack_id, name=PACKS[pack_id]["name"])
        monitor = DownloadProgressMonitor(root)
        monitor.start()
        try:
            _download_pack(wgp, pack_id)
        finally:
            monitor.stop()
        completed.add(pack_id)
        _save_state(app_data_dir, completed)
        _event("pack-complete", id=pack_id, name=PACKS[pack_id]["name"])
    _event("complete")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
