"""Focused checks for WanGP model-pack dependency downloads."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from wangp_model_packs import (
    PACKS,
    _delete_pack_files,
    _download_model_dependencies,
    _load_state,
)


def test_music_packs_use_verified_wangp_model_types() -> None:
    assert PACKS["ace_step_15_turbo"]["model_type"] == "ace_step_v1_5_turbo_lm_1_7b"
    assert (
        PACKS["ace_step_15_xl_turbo"]["model_type"]
        == "ace_step_v1_5_xl_turbo_lm_1_7b"
    )


class FakeWanGP:
    transformer_quantization = "int8"
    transformer_dtype_policy = "auto"
    text_encoder_quantization = "int8"

    def __init__(self) -> None:
        self.downloads: list[tuple[str, str, int, int, str | None]] = []

    def get_model_def(self, model_type: str) -> dict[str, Any]:
        assert model_type == "example"
        return {
            "URLs2": ["second"],
            "text_encoder_folder": "text_encoder",
        }

    def get_model_filename(
        self,
        model_type: str,
        quantization: str,
        dtype_policy: str,
        *,
        submodel_no: int = 1,
        URLs: Any = None,
        module_type: Any = None,
    ) -> str:
        assert model_type == "example"
        if URLs is not None:
            return f"urls:{URLs}"
        if module_type is not None:
            return f"module:{module_type}"
        return "main:2" if submodel_no == 2 else "main:1"

    def get_model_recursive_prop(
        self,
        model_or_module: str,
        prop: str,
        *,
        sub_prop_name: str | None = None,
        return_list: bool = False,
    ) -> Any:
        del sub_prop_name, return_list
        if prop == "modules" and model_or_module == "example":
            return ["named_module", {"URLs": ["left"], "URLs2": ["right"]}]
        if prop == "modules":
            return model_or_module
        if prop == "text_encoder_URLs":
            return ["text_encoder"]
        raise AssertionError(prop)

    def download_models(
        self,
        filename: str,
        model_type: str,
        file_type: int,
        submodel_no: int = 1,
        force_path: str | None = None,
    ) -> None:
        self.downloads.append((filename, model_type, file_type, submodel_no, force_path))


def test_download_model_dependencies_matches_wangp_generation_preflight() -> None:
    wgp = FakeWanGP()

    _download_model_dependencies(wgp, "example")

    assert wgp.downloads == [
        ("main:1", "example", 0, 1, None),
        ("main:2", "example", 0, 2, None),
        ("module:named_module", "example", 1, 0, None),
        ("urls:['left']", "example", 1, 1, None),
        ("urls:['right']", "example", 1, 2, None),
        ("urls:['text_encoder']", "example", 2, -1, "text_encoder"),
    ]


def test_legacy_completion_marker_is_not_treated_as_verified(tmp_path: Path) -> None:
    (tmp_path / "model-pack-state.json").write_text(
        '{"completed": ["z_image_turbo"]}',
        encoding="utf-8",
    )

    assert _load_state(tmp_path) == {}


def test_delete_pack_keeps_files_referenced_by_another_pack(tmp_path: Path) -> None:
    shared = tmp_path / "ckpts" / "shared.safetensors"
    first_only = tmp_path / "ckpts" / "first.safetensors"
    second_only = tmp_path / "ckpts" / "second.safetensors"
    shared.parent.mkdir()
    for file_path in (shared, first_only, second_only):
        file_path.write_bytes(b"model")
    manifests = {
        "first": ["ckpts/shared.safetensors", "ckpts/first.safetensors"],
        "second": ["ckpts/shared.safetensors", "ckpts/second.safetensors"],
    }

    _delete_pack_files(tmp_path, manifests, "first")

    assert manifests == {"second": ["ckpts/shared.safetensors", "ckpts/second.safetensors"]}
    assert shared.is_file()
    assert not first_only.exists()
    assert second_only.is_file()

    _delete_pack_files(tmp_path, manifests, "second")

    assert manifests == {}
    assert not shared.exists()
    assert not second_only.exists()


def test_delete_pack_rejects_manifest_path_outside_wangp_root(tmp_path: Path) -> None:
    wangp_root = tmp_path / "wangp"
    wangp_root.mkdir()
    external_file = tmp_path / "keep.txt"
    external_file.write_text("keep", encoding="utf-8")
    manifests = {"pack": [str(external_file)]}

    try:
        _delete_pack_files(wangp_root, manifests, "pack")
    except RuntimeError as exc:
        assert "outside configured model directories" in str(exc)
    else:
        raise AssertionError("Expected deletion outside WanGP root to be rejected")

    assert external_file.read_text(encoding="utf-8") == "keep"
    assert manifests == {"pack": [str(external_file)]}


def test_delete_pack_allows_configured_checkpoints_directory(tmp_path: Path) -> None:
    wangp_root = tmp_path / "wangp"
    checkpoints_dir = tmp_path / "existing-wangp" / "ckpts"
    wangp_root.mkdir()
    checkpoints_dir.mkdir(parents=True)
    model_file = checkpoints_dir / "model.safetensors"
    model_file.write_bytes(b"model")
    manifests = {"pack": [str(model_file)]}

    _delete_pack_files(wangp_root, manifests, "pack", checkpoints_dir)

    assert manifests == {}
    assert not model_file.exists()
