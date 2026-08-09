#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WAN2GP_DIR="${PROJECT_DIR}/Wan2GP"
API_FILE="${WAN2GP_DIR}/shared/api.py"
EXTERNAL_ROOT="${WANGP_ROOT:-${WANGP_WGP_PATH:-}}"
SOURCE_FILE="${SCRIPT_DIR}/wangp-source.json"

[ -f "$SOURCE_FILE" ] || { echo "WanGP source manifest not found: $SOURCE_FILE"; exit 1; }
json_value() {
  sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$SOURCE_FILE" | head -n 1
}
REPO_URL="${1:-$(json_value repository)}"
BRANCH="$(json_value branch)"
[ -n "$REPO_URL" ] || { echo "WanGP source manifest must define repository."; exit 1; }
[ -n "$BRANCH" ] || { echo "WanGP source manifest must define branch."; exit 1; }

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
  git clone --filter=blob:none --branch "$BRANCH" --single-branch "$REPO_URL" "$WAN2GP_DIR"
  LOCAL_CHECKOUT=1
fi

if [ "${LOCAL_CHECKOUT:-0}" = "1" ]; then
  [ -z "$(git -C "$WAN2GP_DIR" status --porcelain --untracked-files=no)" ] || {
    echo "WanGP checkout has local source changes. Commit them in the WanGP fork or restore the checkout before continuing."
    exit 1
  }
  git -C "$WAN2GP_DIR" fetch "$REPO_URL" "$BRANCH" --depth 1
  git -C "$WAN2GP_DIR" checkout --detach FETCH_HEAD
fi

ACTUAL_REVISION="$(git -C "$WAN2GP_DIR" rev-parse HEAD)"
echo "WanGP source: $BRANCH @ $ACTUAL_REVISION"

if [ ! -f "$API_FILE" ]; then
  echo "Wan2GP checkout does not expose shared/api.py yet. Update the checkout to a version that includes the new API."
  exit 1
fi
