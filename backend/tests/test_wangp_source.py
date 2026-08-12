from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).parents[2]
SOURCE_FILE = PROJECT_ROOT / "scripts" / "wangp-source.json"
BOOTSTRAP_FILE = PROJECT_ROOT / "scripts" / "ensure-wan2gp.ps1"


def test_wangp_source_manifest_tracks_aivs_branch_head() -> None:
    source = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))

    assert source["repository"] == "https://github.com/GOvEy1nw/Wan2GP.git"
    assert source["branch"] == "AiVS"
    assert "revision" not in source
    assert "wangpVersion" not in source


def test_wangp_bootstrap_validates_external_and_transactional_managed_roots() -> None:
    bootstrap = BOOTSTRAP_FILE.read_text(encoding="utf-8")

    assert "ValidateSet('External', 'Managed')" in bootstrap
    assert "WANGP_ROOT" in bootstrap and "WANGP_WGP_PATH" in bootstrap
    assert "shared\\api.py" in bootstrap and "requirements.txt" in bootstrap
    assert "candidate" in bootstrap and "backup" in bootstrap
    assert "git clone" not in bootstrap
    assert "& $GitExe" in bootstrap and " clone --filter=blob:none" in bootstrap
    assert "git-remote-https.exe" in bootstrap
    assert "GIT_EXEC_PATH" in bootstrap
    assert "http.sslBackend=openssl" in bootstrap
    assert "ca-bundle.crt" in bootstrap
    assert "Move-WanGPDirectory" in bootstrap
