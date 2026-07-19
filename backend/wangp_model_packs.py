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
}


def _event(event: str, **values: object) -> None:
    print(f"AIVS_PACK:{json.dumps({'event': event, **values})}", flush=True)


def _state_path(app_data_dir: Path) -> Path:
    return app_data_dir / "model-pack-state.json"


def _load_state(app_data_dir: Path) -> dict[str, list[str]]:
    try:
        raw_object: object = json.loads(_state_path(app_data_dir).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(raw_object, dict):
        return {}
    raw = cast(dict[str, object], raw_object)
    files = raw.get("files", {})
    if not isinstance(files, dict):
        return {}
    manifests: dict[str, list[str]] = {}
    for pack_id, paths in cast(dict[object, object], files).items():
        if not isinstance(pack_id, str) or not isinstance(paths, list):
            continue
        manifests[pack_id] = [path for path in cast(list[object], paths) if isinstance(path, str)]
    return manifests


def _save_state(app_data_dir: Path, manifests: dict[str, list[str]]) -> None:
    path = _state_path(app_data_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"completed": sorted(manifests), "files": manifests}, indent=2),
        encoding="utf-8",
    )


def _manifest_path(root: Path, path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(root).as_posix()
    except ValueError:
        return str(resolved)


def _manifest_file_path(root: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else root / path


def _delete_pack_files(
    root: Path,
    manifests: dict[str, list[str]],
    pack_id: str,
    checkpoints_dir: Path | None = None,
) -> None:
    manifest = manifests.get(pack_id)
    if manifest is None:
        return

    file_paths = [_manifest_file_path(root, value) for value in manifest]
    allowed_roots = [root.resolve()]
    if checkpoints_dir is not None:
        allowed_roots.append(checkpoints_dir.resolve())
    outside_root: list[str] = []
    for file_path in file_paths:
        if not any(file_path.resolve().is_relative_to(allowed_root) for allowed_root in allowed_roots):
            outside_root.append(str(file_path))
    if outside_root:
        raise RuntimeError(
            "Refusing to delete model-pack files outside configured model directories: "
            + ", ".join(outside_root)
        )

    shared_paths = {
        os.path.normcase(os.path.abspath(_manifest_file_path(root, value)))
        for other_id, paths in manifests.items()
        if other_id != pack_id
        for value in paths
    }
    errors: list[str] = []
    for file_path in file_paths:
        if os.path.normcase(os.path.abspath(file_path)) in shared_paths:
            continue
        try:
            file_path.unlink(missing_ok=True)
        except OSError as exc:
            errors.append(f"{file_path}: {exc}")
    if errors:
        raise RuntimeError("Could not delete model-pack files: " + "; ".join(errors))
    del manifests[pack_id]


class DownloadProgressMonitor:
    """Report growing WanGP checkpoint files when Hugging Face hides its TTY bar."""

    def __init__(self, checkpoints_dir: Path) -> None:
        self._root = checkpoints_dir
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


def _create_model_manager(wgp: Any) -> Any:
    try:
        plugin_module = import_module("plugins.models_manager.plugin")
    except ModuleNotFoundError as exc:
        raise RuntimeError("Bundled WanGP Model Manager plugin is missing") from exc
    manager = plugin_module.modelsManagerPlugin()
    manager.setup_ui()
    missing_globals: list[str] = []
    for name in cast(list[str], manager.global_requests):
        if not hasattr(wgp, name):
            missing_globals.append(name)
            continue
        setattr(manager, name, getattr(wgp, name))
    if missing_globals:
        raise RuntimeError(
            "Bundled WanGP Model Manager is incompatible; missing globals: "
            + ", ".join(sorted(missing_globals))
        )
    return manager


def _download_model_dependencies(wgp: Any, model_type: str) -> None:
    """Mirror WanGP load_models download preflight without loading model weights."""
    model_def = cast(dict[str, Any], wgp.get_model_def(model_type))
    quantization = wgp.transformer_quantization
    dtype_policy = wgp.transformer_dtype_policy
    main_filename = wgp.get_model_filename(model_type, quantization, dtype_policy)
    downloaded_main = False
    if main_filename:
        wgp.download_models(main_filename, model_type, file_type=0, submodel_no=1)
        downloaded_main = True

    if "URLs2" in model_def:
        second_filename = wgp.get_model_filename(
            model_type,
            quantization,
            dtype_policy,
            submodel_no=2,
        )
        if second_filename:
            wgp.download_models(second_filename, model_type, file_type=0, submodel_no=2)
            downloaded_main = True

    raw_modules = cast(
        list[object],
        wgp.get_model_recursive_prop(model_type, "modules", return_list=True) or [],
    )
    modules: list[object] = [
        wgp.get_model_recursive_prop(module, "modules", sub_prop_name="_list", return_list=True)
        if isinstance(module, str)
        else module
        for module in raw_modules
    ]
    for module in modules:
        if isinstance(module, dict):
            module_def = cast(dict[str, object], module)
            urls1 = module_def.get("URLs")
            urls2 = module_def.get("URLs2")
            if urls1 is None or urls2 is None:
                raise RuntimeError(f"WanGP module definition is missing URLs/URLs2: {module}")
            for urls, submodel_no in ((urls1, 1), (urls2, 2)):
                filename = wgp.get_model_filename(
                    model_type,
                    quantization,
                    dtype_policy,
                    URLs=urls,
                )
                if filename:
                    wgp.download_models(filename, model_type, file_type=1, submodel_no=submodel_no)
        else:
            filename = wgp.get_model_filename(
                model_type,
                quantization,
                dtype_policy,
                module_type=module,
            )
            if filename:
                wgp.download_models(filename, model_type, file_type=1, submodel_no=0)

    if not downloaded_main:
        wgp.download_models("", model_type, file_type=0, submodel_no=-1)

    text_encoder_urls = wgp.get_model_recursive_prop(
        model_type,
        "text_encoder_URLs",
        return_list=True,
    )
    if text_encoder_urls:
        text_encoder_filename = wgp.get_model_filename(
            model_type,
            wgp.text_encoder_quantization,
            dtype_policy,
            URLs=text_encoder_urls,
        )
        if text_encoder_filename:
            wgp.download_models(
                text_encoder_filename,
                model_type,
                file_type=2,
                submodel_no=-1,
                force_path=model_def.get("text_encoder_folder"),
            )


def _download_def_paths(manager: Any, definitions: Any) -> set[Path]:
    return {Path(path) for path in manager._collect_download_def_file_paths(definitions)}


def _model_paths(manager: Any, model_type: str) -> set[Path]:
    model_dropdowns = import_module("shared.model_dropdowns")
    deps = manager._build_dropdown_deps([model_type])
    if deps is None:
        raise RuntimeError(f"WanGP Model Manager could not resolve model '{model_type}'")
    entries = [
        *model_dropdowns.get_expected_core_file_entries_for_status(deps, model_type),
        *model_dropdowns.get_expected_secondary_file_entries_for_status(deps, model_type),
    ]
    paths = {
        Path(path)
        for entry in entries
        if (path := manager._resolve_expected_entry_path(entry, model_type=model_type))
    }
    model_def = manager.get_model_def(model_type)
    paths.update(Path(path) for path in manager._collect_handler_file_paths(model_type, model_def))
    return paths


def _validate_paths(pack_id: str, paths: set[Path]) -> set[Path]:
    missing = sorted(str(path) for path in paths if not path.is_file())
    if missing:
        preview = ", ".join(missing[:5])
        suffix = f" (and {len(missing) - 5} more)" if len(missing) > 5 else ""
        raise RuntimeError(f"Model pack '{pack_id}' is incomplete; missing: {preview}{suffix}")
    if not paths:
        raise RuntimeError(f"Model pack '{pack_id}' resolved no required files")
    return paths


def _download_pack(wgp: Any, manager: Any, pack_id: str) -> set[Path]:
    pack = PACKS[pack_id]
    kind = pack["kind"]
    if kind == "utility":
        definition = wgp.query_core_shared_model_files()
        wgp.process_files_def(**definition)
    elif kind == "prompt":
        assets = import_module("shared.prompt_enhancer.assets")
        definitions = cast(list[dict[str, Any]], assets.query_prompt_enhancer_download_defs())
        for definition in definitions:
            wgp.process_files_def(**definition)
    else:
        _download_model_dependencies(wgp, pack["model_type"])
    return _validate_paths(pack_id, _resolve_pack_paths(wgp, manager, pack_id))


def _resolve_pack_paths(wgp: Any, manager: Any, pack_id: str) -> set[Path]:
    """Resolve expected local files without downloading anything."""
    pack = PACKS[pack_id]
    kind = pack["kind"]
    if kind == "utility":
        return _download_def_paths(manager, wgp.query_core_shared_model_files())
    if kind == "prompt":
        assets = import_module("shared.prompt_enhancer.assets")
        definitions = cast(list[dict[str, Any]], assets.query_prompt_enhancer_download_defs())
        return _download_def_paths(manager, definitions)

    model_type = pack["model_type"]
    paths = _model_paths(manager, model_type)
    paths.update(
        _download_def_paths(
            manager,
            [
                wgp.query_core_shared_model_files(),
                wgp.query_matanyone_download_def(wgp.server_config),
            ],
        )
    )
    return paths


def main() -> int:
    warnings.filterwarnings("ignore", message="The pynvml package is deprecated.*", category=FutureWarning)
    parser = argparse.ArgumentParser()
    parser.add_argument("--wangp-root", required=True)
    parser.add_argument("--app-data-dir", required=True)
    parser.add_argument("--checkpoints-dir")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--download", nargs="*")
    parser.add_argument("--delete", nargs="*")
    args = parser.parse_args()

    root = Path(args.wangp_root).resolve()
    app_data_dir = Path(args.app_data_dir).resolve()
    checkpoints_dir = (
        Path(args.checkpoints_dir).resolve()
        if args.checkpoints_dir
        else root / "ckpts"
    )
    if not (root / "wgp.py").is_file():
        raise RuntimeError("Bundled WanGP checkout is missing wgp.py")

    manifests = _load_state(app_data_dir)
    requested = cast(list[str], args.download or [])
    delete_requested = cast(list[str], args.delete or [])
    unknown = (set(requested) | set(delete_requested)) - set(PACKS)
    if unknown:
        raise RuntimeError(f"Unknown model packs: {', '.join(sorted(unknown))}")

    for pack_id in delete_requested:
        _delete_pack_files(root, manifests, pack_id, checkpoints_dir)
        _save_state(app_data_dir, manifests)
    if args.delete is not None:
        return 0

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
    files_locator = import_module("shared.utils.files_locator")
    checkpoint_paths = [str(checkpoints_dir), "."]
    files_locator.set_checkpoints_paths(checkpoint_paths)
    wgp.server_config["checkpoints_paths"] = checkpoint_paths
    manager = _create_model_manager(wgp)

    if args.list:
        installed_packs: list[dict[str, object]] = []
        for pack_id in PACKS:
            paths = _resolve_pack_paths(wgp, manager, pack_id)
            installed = bool(paths) and all(path.is_file() for path in paths)
            if installed:
                manifests[pack_id] = sorted(_manifest_path(root, path) for path in paths)
            else:
                manifests.pop(pack_id, None)
            installed_packs.append({"id": pack_id, "installed": installed})
        _save_state(app_data_dir, manifests)
        _event("packs", packs=installed_packs)
        return 0

    for pack_id in requested:
        _event("pack-start", id=pack_id, name=PACKS[pack_id]["name"])
        monitor = DownloadProgressMonitor(checkpoints_dir)
        monitor.start()
        try:
            paths = _download_pack(wgp, manager, pack_id)
        finally:
            monitor.stop()
        manifests[pack_id] = sorted(_manifest_path(root, path) for path in paths)
        _save_state(app_data_dir, manifests)
        _event("pack-complete", id=pack_id, name=PACKS[pack_id]["name"])
    _event("complete")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
