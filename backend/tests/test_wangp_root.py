from pathlib import Path

from wangp_root import resolve_wangp_root


def test_resolve_wangp_root_requires_explicit_complete_checkout(tmp_path: Path) -> None:
    root = tmp_path / "external"
    (root / "shared").mkdir(parents=True)
    for relative in ("wgp.py", "shared/api.py", "requirements.txt"):
        (root / relative).write_text("", encoding="utf-8")

    assert resolve_wangp_root({}) is None
    assert resolve_wangp_root({"WANGP_ROOT": str(tmp_path / "missing")}) is None
    assert resolve_wangp_root({"WANGP_ROOT": str(root / "wgp.py")}) == root.resolve()
