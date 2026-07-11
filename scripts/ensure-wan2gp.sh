#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WAN2GP_DIR="${PROJECT_DIR}/Wan2GP"
API_FILE="${WAN2GP_DIR}/shared/api.py"
REPO_URL="${1:-https://github.com/deepbeepmeep/Wan2GP.git}"
EXTERNAL_ROOT="${WANGP_ROOT:-${WANGP_WGP_PATH:-}}"
REVISION_FILE="${SCRIPT_DIR}/wangp-revision.txt"

[ -f "$REVISION_FILE" ] || { echo "WanGP revision file not found: $REVISION_FILE"; exit 1; }
EXPECTED_REVISION="$(tr -d '[:space:]' < "$REVISION_FILE")"
[[ "$EXPECTED_REVISION" =~ ^[0-9a-f]{40}$ ]] || { echo "WanGP revision must be a full 40-character Git SHA."; exit 1; }

resolve_external_root() {
  local candidate="$1"
  [ -n "$candidate" ] || return 1
  if [ -f "$candidate" ]; then
    [ "$(basename "$candidate")" = "wgp.py" ] || return 1
    candidate="$(dirname "$candidate")"
  fi
  [ -f "$candidate/wgp.py" ] || return 1
  printf '%s\n' "$candidate"
}

if [ -d "$WAN2GP_DIR" ]; then
  echo "Wan2GP checkout found at $WAN2GP_DIR"
  LOCAL_CHECKOUT=1
elif RESOLVED_EXTERNAL_ROOT="$(resolve_external_root "$EXTERNAL_ROOT")"; then
  WAN2GP_DIR="$RESOLVED_EXTERNAL_ROOT"
  API_FILE="${WAN2GP_DIR}/shared/api.py"
  echo "Using external Wan2GP checkout at $WAN2GP_DIR"
  LOCAL_CHECKOUT=0
else
  command -v git >/dev/null 2>&1 || {
    echo "git not found. Install Git before running setup, or set WANGP_ROOT to an existing Wan2GP checkout."
    exit 1
  }
  echo "Cloning Wan2GP into $WAN2GP_DIR..."
  git clone --filter=blob:none "$REPO_URL" "$WAN2GP_DIR"
  LOCAL_CHECKOUT=1
fi

if [ "${LOCAL_CHECKOUT:-0}" = "1" ]; then
  git -C "$WAN2GP_DIR" fetch origin "$EXPECTED_REVISION" --depth 1
  git -C "$WAN2GP_DIR" checkout --detach "$EXPECTED_REVISION"
fi

ACTUAL_REVISION="$(git -C "$WAN2GP_DIR" rev-parse HEAD)"
[ "$ACTUAL_REVISION" = "$EXPECTED_REVISION" ] || { echo "WanGP revision mismatch. Expected $EXPECTED_REVISION, found $ACTUAL_REVISION."; exit 1; }
echo "WanGP revision: $ACTUAL_REVISION"

if [ ! -f "$API_FILE" ]; then
  echo "Wan2GP checkout does not expose shared/api.py yet. Update the checkout to a version that includes the new API."
  exit 1
fi
