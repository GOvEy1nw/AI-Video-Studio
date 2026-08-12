from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path


_REQUIRED_FILES = ("wgp.py", "shared/api.py", "requirements.txt")


def resolve_wangp_root(environment: Mapping[str, str]) -> Path | None:
    for key in ("WANGP_ROOT", "WANGP_WGP_PATH"):
        value = environment.get(key, "").strip()
        if not value:
            continue
        candidate = Path(value)
        if candidate.is_file():
            candidate = candidate.parent
        try:
            root = candidate.resolve()
        except OSError:
            continue
        if all((root / relative).is_file() for relative in _REQUIRED_FILES):
            return root
    return None
