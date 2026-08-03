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
- Image/video clients send semantic `enhancePrompt`; backend owns WanGP's raw `prompt_enhancer` value. Disabled sends `""`. Enabled text-only sends `"T"`; enhancer-visible start/end/reference images add `I`; relay shot prompts add `1`. This yields `T`, `TI`, `T1`, or `TI1`. Control guides and Continue Video sources do not count as enhancer-visible images. Profile defaults are always overridden, including Region's forced disabled state.
- Curated Video Tools use the typed `videoTool` request field. Extend keeps the existing `continue_video` path; Relight, Colorize, Clean Plate, Lip Dub, Decompression, SDR to HDR, Remove Glare, and Deblur map to backend-owned exact IC-LoRA URLs with guide-only input, `guidance_phases=2`, and an empty LoRA multiplier. Unknown tool IDs are rejected before WanGP execution.
- Every LTX video submission, including Director, forces WanGP `config="PrunaAI VAE"` at the shared bridge boundary.
- Image requests use the same mechanism with the configured image model.
- ACE-Step song-description enhancement remains LM CoT through `model_mode`: manual/off `1`, manual/on `2`, auto-duration/off `4`, and auto-duration/on `3`. Auto Lyrics passes the song description as lyrics context with `prompt_enhancer="T"`; Instrumental and Custom Lyrics send `""`. Empty Custom Lyrics is rejected, while `/api/music/compose-lyrics` remains a separate editable pre-generation operation.
- Progress comes from WanGP's native `send_cmd(...)` events, with stdout/stderr also streamed into the bridge.
- Cancel requests signal the active WanGP model directly instead of terminating a subprocess.
- LTX Desktop first-run "download" becomes a no-op when the bridge is enabled, because model management is delegated to WanGP.
