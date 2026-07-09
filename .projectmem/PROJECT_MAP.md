# Project Map - AI Video Studio

Status: Updated 2026-07-09 after Reframe gen mode (outpaint UI, zoom/pan UX, backend WanGP mapping).

## Purpose

AI Video Studio is a local-first desktop creative app for AI image, video, and future audio/TTS generation. It is forked from `deepbeepmeep/LTX-Desktop-WanGP` and evolves that inherited foundation into an AiVS product powered by WanGP / Wan2GP.

## Stack

- Frontend: React 18, TypeScript, Vite 5, Tailwind CSS
- Electron: Electron 31 main process plus context-isolated preload
- Backend: Python 3.11.9, FastAPI, uvicorn, uv
- Package manager: pnpm 10.30.3
- Packaging: electron-builder
- Runtime: WanGP / Wan2GP through in-process `WanGPSession`
- GPU stack: configured by `scripts/wangp-stacks.json` and installed by `scripts/install-wangp-stack.ps1`
- Testing: backend pytest with service fakes, pyright strict mode, TypeScript `tsc --noEmit`

## Architecture

```text
Renderer (React + TS)
  | HTTP localhost:8000
  v
Backend (FastAPI + Python)
  | in-process API
  v
WanGP / Wan2GP

Renderer
  | IPC through preload
  v
Electron main
  | OS integration
  v
Files, dialogs, ffmpeg, backend process management
```

## Main folders

- `frontend/` - React renderer, QuickGen UI, project views, editor views, hooks, types.
- `electron/` - Electron main process, preload bridge, app lifecycle, IPC, export, backend supervision.
- `backend/` - FastAPI server, handlers, services, state, runtime config, tests.
- `backend/model_profiles/` - backend-owned curated AiVS model profiles and resolution resolver.
- `scripts/` - dev setup, build scripts, WanGP GPU stack installer.
- `docs/` - phase docs, WanGP docs, installer/backend docs.
- `resources/` - app/build resources.
- `.projectmem/` - project memory snapshots for agents.
- `Wan2GP/` - optional repo-local WanGP checkout, untracked.

## Frontend map

### Primary files

- `frontend/views/GenSpace.tsx` - QuickGen surface for image/video/retake/**reframe** modes, prompt bar, profile-driven controls, media input strip, gallery with filters/bins/list view, asset persistence.
- `frontend/components/ReframePanel.tsx` - Reframe mode panel: video preview, trim (`VideoTrimPanel`), zoom/pan overlay, emits `ReframePanelState` to GenSpace.
- `frontend/components/OutpaintFrameOverlay.tsx` - Draggable outpaint frame overlay: aspect chips (1:1/16:9/9:16/custom), zoom slider (preset modes), mirrored edge handles (custom), pan area, refresh reset, padding label.
- `frontend/lib/reframe-outpaint.ts` - Reframe padding/layout math (fit, max aspect zoom, pan, mirrored expand, two-phase frame layout).
- `frontend/components/VideoTrimPanel.tsx` - Shared trim UI extracted for Retake and Reframe panels.
- `frontend/lib/media-import.ts` - GenSpace media ingestion (copy-into-project), gallery file import, input-to-gallery sync, duplicate filename handling.
- `frontend/lib/gallery-filters.ts` - Gallery type/source/bin filter helpers and display filename inference.
- `frontend/lib/asset-delete.ts` - Scoped project asset delete with media handle release before trash.
- `frontend/lib/asset-copy.ts` - Move generated outputs into project `generated/` folder.
- `frontend/components/GalleryFilters.tsx` - Icon-only filter trigger; type/source toggle chips in popover.
- `frontend/components/GalleryBinBar.tsx` - Bin chips, create/rename/delete, drag-to-assign; toolbar row left of view controls.
- `frontend/components/GalleryAssetContextMenu.tsx` - Right-click asset → Move to Bin / New Bin / Remove from Bin.
- `frontend/components/DuplicateFilenameDialog.tsx` - Basename collision modal for uploads.
- `frontend/hooks/use-generation.ts` - submit/cancel/progress polling for video and image generation.
- `frontend/hooks/use-image-profiles.ts` - fetches model profiles and exposes image/video filtered hooks.
- `frontend/types/model-profiles.ts` - frontend mirror of backend model profile API.
- `frontend/types/project.ts` - project, asset, generation metadata types.
- `frontend/contexts/ProjectContext.tsx` - project state, assets, view routing, editor-to-GenSpace handoff.
- `frontend/views/VideoEditor.tsx` - inherited video editor, retained as beta/future workflow surface.

### Current QuickGen behavior

- Image and video modes use profile-driven model dropdowns.
- Image mode shows media input strip above prompt only when selected profile supports inputs.
- Supported image profiles expose role selector per input thumbnail.
- Video mode is profile-driven and exposes simple controls plus optional multi-shot prompt rows.
- Multi-shot mode replaces the prompt textarea with an optional global prompt row and timed shot rows capped at 20 total seconds.
- Prompt enhancement is available in image/video prompt areas and routes through WanGP.
- Gallery persistence guards avoid repeated save loops after generation completion.

### GenSpace media library (phases A–D, `docs/MEDIA_LIBRARY_PLAN.md`)

- **Storage:** GenSpace copies into `{AiVS Assets}/{projectId}/uploads/` (imports) and `generated/` (WanGP outputs moved from staging). Editor still references heavy imports in place.
- **Inputs:** Gallery drag video/audio/image to prompt slots; single file picker infers role for Vid/Aud.
- **Import:** OS drop on gallery + input attach sync via `media-import.ts`; duplicate basename dialog (reuse / suffix / cancel).
- **Gallery UI:** Grid sizes (small/medium/large) + list view (`AssetListRow`); hover filename overlay; audio/video hover preview; lightbox supports audio.
- **Toolbar (left→right):** filter icon → favorites heart → bin chips; view size menu on the right. Toolbar controls use `h-8` with reserved border to avoid layout shift.
- **Filters:** Type (image/video/audio) + source (generated/uploaded) as blue/grey toggle chips; combines with favorites and bin selection.
- **Bins:** `Asset.bin` string labels; shared with video editor; create/rename/delete, drag or context menu assign. Phase E mini picker cancelled.

### Reframe gen mode (outpaint reframe)

- **UI:** GenSpace mode `reframe` → `ReframePanel` (no prompt box). User picks aspect (1:1 / 16:9 / 9:16 / custom), trims clip, adjusts frame via overlay.
- **Preset aspects:** Zoom slider 0% = fit box (`computeFitPadding`), 100% = max expansion at target aspect (`computeMaxAspectZoomPadding` — e.g. 1:1→16:9 max is L/R 100%, T/B ~34%, not all edges 100%). Pan drag reframes video inside box.
- **Custom:** Mirrored edge drag expands both sides on an axis; pan for fine reframe. Edge handles hidden in preset modes.
- **Padding limits:** UI expand/zoom capped at 100% per edge; pan may redistribute up to 200% on one side internally (`MAX_PADDING_INTERNAL`).
- **Reset:** Refresh button (after aspect chips) resets zoom to 0 and padding to fit (presets) or zero (custom) without changing aspect mode.
- **Generate:** `use-generation.ts` sends `reframe` on POST `/api/generate` with padding, aspectMode, trim; `normalizeReframeForApi` clamps 0–200.
- **Persistence:** `generationParams` stores reframe fields; gallery Apply prompt restores via `apply-generation-params.ts`.
- **Backend:** `video_generation_handler` reframe branch → FFmpeg clip extract → `reframe_wangp_mapping.py` → WanGP `video_guide_outpainting*` + `video_prompt_type` `VG` + prompt `outpaint`.
- **API types:** `ReframeOptions`, `ReframePadding` in `api_types.py` — per-edge `le=200` required for pan >100% (100 rejects whole payload).

## Backend map

### Primary files

- `backend/ltx2_server.py` - runtime bootstrap, config, uvicorn entry.
- `backend/app_factory.py` - FastAPI app factory, routers, exception/logging boundary.
- `backend/app_handler.py` - composition root for handlers, state, services.
- `backend/api_types.py` - Pydantic request/response models.
- `backend/handlers/image_generation_handler.py` - WanGP image generation routing and profile validation.
- `backend/handlers/video_generation_handler.py` - WanGP video generation routing, profile validation, **reframe/outpaint branch**.
- `backend/services/reframe_wangp_mapping.py` - Maps reframe padding percentages to WanGP outpaint guide fields.
- `backend/services/video_clip.py` - FFmpeg clip extraction for reframe trim window.
- `backend/handlers/prompt_enhancement_handler.py` - WanGP prompt enhancement routing.
- `backend/handlers/model_profiles_handler.py` - `GET /api/model-profiles`.
- `backend/services/wangp_bridge.py` - WanGP API bridge for image/video manifest execution.
- `backend/model_profiles/profiles.py` - curated image/video model profiles plus raw WanGP metadata.
- `backend/model_profiles/resolution_resolver.py` - curated image profile resolution table.
- `backend/tests/fakes/fake_wangp_bridge.py` - fake bridge used by tests.

### Route pattern

Routes remain thin. Request flow:

```text
_routes/* -> AppHandler -> handlers/* -> services/* + state/*
```

Heavy side effects live behind services. Tests use fakes instead of mocks.

## Electron map

### Primary files

- `electron/lib/project-asset-import.ts` - Copy/import into project uploads with suffix/reuse/overwrite strategies.
- `electron/lib/project-asset-delete.ts` - Scoped trash with retry for Windows file locks.
- `electron/ipc/file-handlers.ts` - IPC for import-to-project-assets, copy-to-project-assets, asset delete/trash.

### Asset IPC

- `import-to-project-assets` → copy to `{projectId}/uploads/`
- `copy-to-project-assets` → move from backend staging to `{projectId}/generated/`

## Model profile contract

Backend owns the curated profile registry. Frontend does not scrape WanGP directly.

Profile response includes:

- AiVS id and display name
- media type
- visibility/status
- WanGP model type
- raw `wangpMetadata`
- curated capabilities
- default/allowed aspect ratios
- default/allowed resolution tiers
- input media policy
- availability state

### Image profiles

- `z_image_turbo`
- `krea2_turbo`
- `flux2_klein_4b`
- `hidream_o1_dev`

### Video profiles

- `ltx2_22b_distilled`, display name `LTX 2.3 Fast`, WanGP model type `ltx2_22B_distilled_1_1`

### Profile rules

- UI-visible model options come from `GET /api/model-profiles`.
- Backend validates profile id and UI choices before WanGP.
- Image generation sends `modelProfileId`, `aspectRatio`, and `resolutionTier`; backend resolves exact `WxH`.
- Video generation sends `modelProfileId`; legacy `model: fast` maps to the curated LTX2 video profile.
- Multi-shot video requests send `shotPrompts`; backend combines the optional global prompt and timed rows into WanGP relayed prompt syntax.
- WanGP manifests use `multi_prompts_gen_type: "FG"` so all lines are treated as one prompt unless relayed ranges are present.
- Raw WanGP metadata is retained separately from AiVS-curated UI capability fields.

## Runtime map

- Python version pinned to 3.11.9.
- `backend/pyproject.toml` pins torch stack versions aligned with installer.
- `scripts/wangp-stacks.json` is the curated GPU stack source.
- `scripts/install-wangp-stack.ps1` detects GPU generation and installs compatible torch/performance wheels.
- Setup scripts and backend tests use `uv sync --inexact` to avoid pruning WanGP requirements/performance wheels from `backend/.venv`.
- `WANGP_VIDEO_MODEL_TYPE` default: `ltx2_22B_distilled_1_1`.
- `WANGP_IMAGE_MODEL_TYPE` default: `z_image`.
- App data folder: AiVS.

## Testing map

- `backend/tests/conftest.py` wires a fresh `AppHandler` per test.
- `enable_wangp` fixture turns on WanGP path and yields `FakeWanGPBridge`.
- `backend/tests/test_model_profiles.py` covers profile shape, endpoint response, availability, image input routing, and profile generation routing.
- `backend/tests/test_generation.py` covers video/image generation behavior through fake WanGP (includes reframe branches).
- `backend/tests/test_reframe_wangp_mapping.py` covers padding → WanGP outpaint field mapping.
- `backend/tests/test_wangp_bridge.py` covers bridge mapping behavior.
- `backend/tests/test_pyright.py` enforces pyright strict mode.

Current verified checks:

- `uv run --extra test pytest -q` -> 214 passed.
- `uv run pyright` -> 0 errors.
- TypeScript `tsc --noEmit` -> passed.
- `pnpm run build:frontend` via direct pnpm -> passed.

## Development commands

| Command                           | Purpose                                            |
| --------------------------------- | -------------------------------------------------- |
| `pnpm dev`                        | Start Vite/Electron/backend dev app                |
| `pnpm dev:debug`                  | Dev app with Electron inspector and Python debugpy |
| `pnpm typecheck`                  | TypeScript + Python type checks                    |
| `pnpm typecheck:ts`               | TypeScript only                                    |
| `pnpm typecheck:py`               | Pyright only                                       |
| `pnpm backend:test`               | Backend pytest                                     |
| `pnpm build:frontend`             | Renderer/Electron build                            |
| `pnpm setup:dev:win`              | Windows setup                                      |
| `scripts/install-wangp-stack.ps1` | Install/refresh WanGP GPU stack                    |

## Known tooling caveat

The Codex bundled `pnpm` wrapper can trigger dependency layout checks and attempt to recreate `node_modules` in non-TTY mode. If this leaves `node_modules` partial, use direct pnpm:

```powershell
C:\Users\rais\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe C:\Users\rais\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.mjs install --force --offline --frozen-lockfile
```

Then run scripts through the same direct pnpm entry if needed.

## Roadmap

| Phase      | Goal                                                                                                                            | Status   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Phase 0    | Fork audit + preservation map                                                                                                   | Complete |
| Phase 1    | Local-only product shell                                                                                                        | Complete |
| Phase 2    | WanGP-only generation enforcement                                                                                               | Complete |
| Phase 3    | QuickGen image baseline                                                                                                         | Complete |
| Phase 4    | Curated image model expansion                                                                                                   | Complete |
| Phase 4.1  | Image input media roles + multi-image support                                                                                   | Complete |
| Phase 4.2  | Video model profile alignment                                                                                                   | Complete |
| Phase 4.3  | Update input media slots for better feature support & run backend/WanGP connection in the background to avoid delays loading UI | Complete |
| Phase 4.41 | WanGP prompt enhancement for image/video modes                                                                                  | Complete |
| Phase 4.42 | Video multi-shot prompt rows with relayed WanGP prompt formatting                                                               | Complete |
| Media A–D  | GenSpace media library: import, gallery filters, bins, list view (`docs/MEDIA_LIBRARY_PLAN.md`)                                 | Complete |
| Reframe    | Outpaint reframe mode: trim, aspect/zoom/pan UI, backend WanGP outpaint mapping                                                 | Complete |
| Phase 5    | LoRA MVP                                                                                                                        | Pending  |
| Phase 6    | QuickGen image polish                                                                                                           | Pending  |
| Phase 7    | Video input capabilities (start/end/control/source video)                                                                       | Pending  |
| Phase 8    | QuickGen audio/TTS                                                                                                              | Pending  |
| Phase 9    | Production planning                                                                                                             | Pending  |

## Next work

- Test and polish multi-shot video prompt behavior against real WanGP output.
- Manual QA reframe against real WanGP (aspect fit, max zoom, pan >100%, custom mirrored edges).
- Add video start frame / end frame / source video / control video UI and backend mapping from existing LTX2 raw metadata.
- Add LoRA folder detection, selection, strength, and metadata.
- Improve model availability/missing-model UX.
- Optional: port GenSpace bin/filter toolbar patterns to video editor LeftPanel for visual parity.
- Keep inherited editor stable and avoid major rewrites until QuickGen is stronger.

## Suggested first reads

1. `AGENTS_PRD.md`
2. `AGENTS.md`
3. `docs/MEDIA_LIBRARY_PLAN.md`
4. `.projectmem/summary.md`
5. `frontend/views/GenSpace.tsx`
6. `frontend/lib/reframe-outpaint.ts` (reframe work)
7. `frontend/components/ReframePanel.tsx` (reframe work)
8. `frontend/lib/media-import.ts`
9. `frontend/lib/gallery-filters.ts`
10. `backend/architecture.md`
11. `backend/services/reframe_wangp_mapping.py` (reframe work)
12. `backend/model_profiles/profiles.py`
13. `backend/services/wangp_bridge.py`
