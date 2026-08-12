#!/usr/bin/env bash
set -euo pipefail

resolve_root() {
  local candidate="$1"
  [ -n "$candidate" ] || return 1
  [ -f "$candidate" ] && { [ "$(basename "$candidate")" = "wgp.py" ] || return 1; candidate="$(dirname "$candidate")"; }
  [ -f "$candidate/wgp.py" ] && [ -f "$candidate/shared/api.py" ] && [ -f "$candidate/requirements.txt" ] || return 1
  cd "$candidate" && pwd
}

WAN2GP_ROOT="$(resolve_root "${WANGP_ROOT:-}" || resolve_root "${WANGP_WGP_PATH:-}" || true)"
[ -n "$WAN2GP_ROOT" ] || { echo 'Set WANGP_ROOT or WANGP_WGP_PATH to an external Wan2GP checkout containing wgp.py, shared/api.py, and requirements.txt.'; exit 1; }
echo "Using external WanGP checkout at $WAN2GP_ROOT"
