from __future__ import annotations

import ast
import json
import re
from pathlib import Path


PROJECT_ROOT = Path(__file__).parents[2]
WANGP_ROOT = PROJECT_ROOT / "Wan2GP"
SOURCE_FILE = PROJECT_ROOT / "scripts" / "wangp-source.json"


def test_wangp_source_manifest_matches_bundled_runtime() -> None:
    source = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))

    assert source["repository"] == "https://github.com/GOvEy1nw/Wan2GP.git"
    assert source["branch"] == "AiVS"
    assert re.fullmatch(r"[0-9a-f]{40}", source["revision"])

    wgp_source = (WANGP_ROOT / "wgp.py").read_text(encoding="utf-8")
    version = re.search(r'^WanGP_version\s*=\s*"([^"]+)"$', wgp_source, re.MULTILINE)
    assert version is not None
    assert version.group(1) == source["wangpVersion"]


def test_wangp_mmgp_requirement_matches_runtime_guard() -> None:
    wgp_source = (WANGP_ROOT / "wgp.py").read_text(encoding="utf-8")
    requirements = (WANGP_ROOT / "requirements.txt").read_text(encoding="utf-8")

    target = re.search(r'^target_mmgp_version\s*=\s*"([^"]+)"$', wgp_source, re.MULTILINE)
    pinned = re.search(r"^mmgp==([^\s]+)$", requirements, re.MULTILINE)
    assert target is not None and pinned is not None
    assert target.group(1) == pinned.group(1)


def test_wangp_session_contract_used_by_aivs_exists() -> None:
    tree = ast.parse((WANGP_ROOT / "shared" / "api.py").read_text(encoding="utf-8"))
    session = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == "WanGPSession")
    methods = {node.name for node in session.body if isinstance(node, ast.FunctionDef)}

    assert {"__init__", "submit_manifest", "close", "cancel"} <= methods
