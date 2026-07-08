# projectmem - AI Video Studio

_Last updated: 2026-07-08_

## Project purpose

AI Video Studio (AiVS) is a local-first desktop app for AI image, video, and future audio/TTS generation. It is forked from `deepbeepmeep/LTX-Desktop-WanGP` and is being reshaped into a Freepik/Higgsfield-style creative studio powered by WanGP / Wan2GP. The project is community-focused, not commercial.

## Current product direction

- Preserve inherited LTX-Desktop-WanGP foundations: Electron shell, React renderer, FastAPI backend, project system, gallery, metadata, output flow, and video editor.
- Normal generation must route through WanGP. Do not expose cloud/API generation as normal product functionality.
- QuickGen comes first: image generation, then video, then audio/TTS, then Production.
- Curated model profiles are the source of truth for UI-visible models and controls. WanGP tells us what can exist; AiVS decides what should be visible.
- Keep QuickGen simple: model, prompt, aspect ratio, resolution, supported media inputs, seed/variations, generate/cancel/progress.

## Completed phases

### Phase 0 - Fork audit

- Completed full inherited-code audit at `docs/PHASE0_AUDIT.md`.
- Identified keep/remove/extend map.
- Confirmed inherited project/gallery/editor/backend foundations should be preserved.

### Phase 1 - Local-only shell

- Rebranded app to AiVS.
- Removed visible cloud/API provider UI and Gemini prompt suggestion path.
- Removed telemetry integration from active app code.
- Updated app data naming to AiVS.

### Phase 2 - WanGP-only enforcement

- Image/video generation handlers now require WanGP for normal generation.
- Retake remains disabled until a WanGP route exists.
- Cloud text encoding path disabled; local encoder is required where text encoding is used.
- Tests were reworked around a `FakeWanGPBridge` instead of dead cloud/API paths.

### Phase 3 - QuickGen image baseline

- Verified local Z-Image Turbo generation end to end through WanGP.
- Output saves into AiVS outputs and appears in inherited gallery/project flow.

### Phase 4 - Curated model profiles

- Backend-owned `backend/model_profiles/` registry added.
- `GET /api/model-profiles` exposes curated image/video profiles plus raw `wangpMetadata`.
- Frontend model selectors now fetch profiles instead of hardcoding model options.
- Backend validates profile id, resolution tier, aspect ratio, and curated resolution before calling WanGP.
- `WanGPBridge.generate_images()` and `generate_video()` accept per-request model type/default settings.

### Phase 4.3 - Combined guide & connection management

- Merged video and audio guide slots into a single dynamic slot with context-aware role selection.
- Handled file validation, request routing, and payload building to route the guides to the WanGP engine manifest.
- Re-routed startup flow to launch the UI instantly, executing backend loading in the background.
- Preloads the WanGP session/runtime at startup without directly calling `wgp.load_models()`, avoiding stuck model loading while keeping first generation snappier.
- Replaced the connection dropdown with a simplified status indicator badge governed by a two-step bridge/WanGP readiness state machine and a 60-second backend connection timeout.
- Connection indicator now shows `Connecting 0/2`, `Connecting 1/2`, `Ready`, or `Disconnected`, and manual backend reconnect forces it back through connecting states until WanGP is ready again.
- Exposed a manual backend restart/reconnect icon button that kills and restarts the Python FastAPI subprocess.

### Phase 4.41 - Prompt enhancement

- Added prompt enhancement for image and video modes through WanGP.
- Prompt enhancement uses the text-only WanGP setting when no start image exists and the text+start-image setting when an input image exists.
- Image/video generation now sends prompts to WanGP as `All the Lines are Part of the Same Prompt`.
- Frontend prompt area shows an enhance icon and swaps to a loading spinner while enhancement is running.

### Phase 4.42 - Video multi-shot prompts

- Added video-only Multi-shot mode in GenSpace.
- Multi-shot mode replaces the normal prompt area with an optional `Global` row plus timed shot rows.
- Shot rows include numbered indicators, two-digit second selectors (`01s`, `02s`, etc.), prompt inputs, and add/remove behavior capped at 20 total seconds.
- Video duration control becomes disabled `auto` while multi-shot mode is active and uses the total shot duration.
- Backend formats multi-shot requests as WanGP relayed prompts using second ranges, with the global prompt before timed ranges when supplied.

## Current model profiles

### Image profiles

- `z_image_turbo` - Z-Image Turbo, stable.
- `krea2_turbo` - Krea 2 Turbo, experimental.
- `flux2_klein_4b` - Flux 2 Klein 4B, experimental.
- `hidream_o1_dev` - HiDream O1, experimental.

Image profile behavior:

- Curated aspect ratios: `1:1`, `16:9`, `9:16`.
- Curated resolution tiers start at `540p`.
- No 4K/2160p by default.
- Backend resolves tier/aspect to exact WanGP `WxH`.
- Z-Image Turbo can route to hidden `z_image_control2_1` when a control input image is supplied.
- Flux and HiDream support multiple image inputs up to 5.
- Image input roles: subject/scene reference, people/object reference, raw control image, pose, depth, canny.
- UI shows horizontal image input drop zones above prompt for image mode when supported.
- Clicking an image input opens a role selector above thumbnail with remove action.
- File input state resets on removal so the same image can be re-added.

### Video profiles

- `ltx2_22b_distilled` - displayed as LTX 2.3 Fast, routed to WanGP model `ltx2_22B_distilled_1_1`.

Video profile behavior:

- Video model dropdown is profile-driven.
- Backend accepts `modelProfileId` on `POST /api/generate`.
- Legacy `model: fast` still maps to the curated LTX2 profile for compatibility.
- Current exposed controls remain simple: duration, resolution tier, aspect ratio, input image, input audio.
- Raw metadata records future capabilities such as start image, end image, control video, continuation, audio, inpainting, outpainting, injected frames, and sliding window.
- UI for end frame/control video/source video is intentionally deferred.

## Recent bug fixes

- Fixed startup/model loading regression where direct WanGP `load_models()` preload could leave model options stuck on "Loading models"; profile fetching now retries while backend/WanGP come up.
- Fixed image generation 540p/720p failure by skipping legacy frontend dimension mapping when `imageProfileId` is set.
- Fixed HTTPError masking in image/video WanGP generation handlers so intentional 400/409 errors are not wrapped as 500s.
- Fixed runaway gallery persistence after image generation by guarding repeated completion effects with a persisted image key, resetting generation state after persistence, and checking duplicate URL/path.
- Fixed same-file image re-add after removal by resetting the hidden file input.
- Switched default video WanGP model from `ltx2_22B_distilled` to `ltx2_22B_distilled_1_1` for higher quality.

## Runtime and dependency state

- Python pinned to 3.11.9 via `.python-version`.
- Backend package: `backend/pyproject.toml`.
- Windows GPU stack installer:
  - `scripts/install-wangp-stack.ps1`
  - `scripts/wangp-stacks.json`
- Stack installer detects NVIDIA GPU generation and selects cu130/cu128 stack.
- Canonical Windows path uses curated wheels for torch, sageattention, sparge/flash/gguf/nunchaku/triton/lightx2v where supported.
- `setup-dev.ps1` calls the stack installer.
- Setup scripts and `pnpm backend:test` use `uv sync --inexact` so uv updates declared backend dependencies without pruning WanGP requirements/performance wheels installed into the same venv.
- `WANGP_VIDEO_MODEL_TYPE` default is now `ltx2_22B_distilled_1_1`.

## Tooling notes

- Backend tests use `enable_wangp` fixture and `FakeWanGPBridge`.
- Full backend suite currently passes: 214 tests.
- Pyright strict mode passes.
- Frontend TypeScript check and frontend build pass.
- The Codex-provided `pnpm` wrapper may try to recreate `node_modules` in non-TTY mode. If `node_modules` is partially rebuilt, invoke the project package manager directly:

```powershell
C:\Users\rais\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe C:\Users\rais\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.mjs install --force --offline --frozen-lockfile
```

Then run:

```powershell
C:\Users\rais\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe C:\Users\rais\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.mjs run typecheck:ts
```

The workspace-local `.pnpm-store/` may appear because pnpm store path is configured inside the repo.

## Key files

- `README.md`
- `AGENTS.md`
- `AGENTS_PRD.md`
- `docs/PHASE0_AUDIT.md`
- `docs/PHASE4_DETAILS.md`
- `backend/ltx2_server.py`
- `backend/app_handler.py`
- `backend/api_types.py`
- `backend/handlers/image_generation_handler.py`
- `backend/handlers/video_generation_handler.py`
- `backend/handlers/prompt_enhancement_handler.py`
- `backend/handlers/model_profiles_handler.py`
- `backend/model_profiles/profiles.py`
- `backend/model_profiles/resolution_resolver.py`
- `backend/services/wangp_bridge.py`
- `backend/tests/fakes/fake_wangp_bridge.py`
- `frontend/views/GenSpace.tsx`
- `frontend/hooks/use-generation.ts`
- `frontend/hooks/use-image-profiles.ts`
- `frontend/types/model-profiles.ts`
- `frontend/types/project.ts`
- `scripts/install-wangp-stack.ps1`
- `scripts/wangp-stacks.json`

## Next likely work

- Test and polish multi-shot video prompt behavior against real WanGP output.
- Add start image and end image video guides.
- Add LoRA MVP.
- Improve model availability/download UX.
- Keep Production deferred until QuickGen image/video are stable.

## Open questions

- Exact UX for video start/end/control inputs.
- Exact LoRA compatibility and metadata UX per WanGP model family.
