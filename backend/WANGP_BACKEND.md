# WanGP Backend Bridge

This backend can delegate `/api/generate` and `/api/generate-image` to an existing WanGP installation instead of using the bundled LTX/ZIT pipelines.

## Source and updates

AiVS packages WanGP for offline, reproducible startup, but the source of truth is the
`AiVS` branch of `GOvEy1nw/Wan2GP`. `scripts/wangp-source.json` records the human-readable
branch/tag and the immutable commit used by development and installer builds.

Use `pnpm wangp:check` to inspect the fork branch head without changing the checkout.
Use `pnpm wangp:update -- -Revision <full-sha>` for focused validation, or add `-Full`
before promotion. Dependency changes are reported and require `-InstallPythonDeps` before
GPU testing. Production builds always consume the exact manifest revision, never a floating
branch head.

## Required

- `WANGP_ROOT`
  - Folder that contains `wgp.py`.

## Optional

- `WANGP_VIDEO_MODEL_TYPE`
  - Defaults to `ltx2_22B_distilled_1_1`.
- `WANGP_IMAGE_MODEL_TYPE`
  - Defaults to `z_image`.
- `WANGP_EXTRA_ARGS`
  - Extra WanGP startup flags passed into `shared.api.WanGPSession`.
  - Example: `--attention sdpa --profile 4`

## Environment Note

- The AiVS backend interpreter must be able to import WanGP directly.
- `WANGP_PYTHON` may still appear in runtime config/logging, but direct bridge execution now happens in-process through WanGP's Python API.

## Behavior

- Video requests are translated into single-task WanGP manifests and executed through `shared.api.WanGPSession`.
- Image requests use the same mechanism with the configured image model.
- Progress comes from WanGP's native `send_cmd(...)` events, with stdout/stderr also streamed into the bridge.
- Cancel requests signal the active WanGP model directly instead of terminating a subprocess.
- LTX Desktop first-run "download" becomes a no-op when the bridge is enabled, because model management is delegated to WanGP.
