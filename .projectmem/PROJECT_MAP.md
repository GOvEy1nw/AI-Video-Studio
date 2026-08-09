# Project Map — AI Video Studio

_Last reviewed: 2026-08-06 against `dev` at `4c246b8`._

> This file is a current-state navigation map for coding agents. It is not a chronological implementation log. Completed phase plans remain useful historical references, but current code, tests, and the focused architecture documents listed near the end of this file are the source of truth.

## Product state

AI Video Studio (AiVS) is a local-first, community-focused desktop creative app built on `deepbeepmeep/LTX-Desktop-WanGP` and powered exclusively by the bundled WanGP / Wan2GP runtime.

Implemented product surfaces:

- **Quick Gen / GenSpace**
  - curated image generation;
  - LTX video generation;
  - video Reframe/outpainting;
  - ACE-Step music generation;
  - shared generation progress, cancellation, result persistence, and Copy Settings.
- **Director V1**
  - frame-based prompt timeline;
  - image keyframes;
  - Continue Video prefix;
  - generated takes and independent preview/playback.
- **Video Editor**
  - inherited NLE-style workspace retained as a separate project tab.
- **Shared Asset Library**
  - project-local imports and generated assets;
  - bins, filters, favourites, grid/list views, context actions, and multi-take assets.
- **Setup and Model Manager**
  - bundled Python/runtime setup;
  - optional WanGP model packs;
  - structured transfer progress and cancellation;
  - configurable project, checkpoint, and LoRA storage locations.

Not yet implemented or intentionally unavailable:

- Retake is visible in GenSpace but disabled until the WanGP path is reliable.
- TTS generation is not implemented.
- User-facing LoRA selection/strength controls are not implemented.
- Director Guide Audio and Control Media authoring remain locked in V1.

## Current stack

The values below reflect the current lock/runtime configuration on `dev`.

| Layer              | Current stack                                                   |
| ------------------ | --------------------------------------------------------------- |
| Renderer           | React 19.2.8, TypeScript 6.0.3, Vite 8.1.5, Tailwind CSS 4.3.3  |
| Frontend tests     | Vitest 4.1.10, jsdom 30.0.0, Testing Library                    |
| Desktop shell      | Electron 43.2.0 with a context-isolated CommonJS preload        |
| Package manager    | pnpm 10.30.3                                                    |
| Packaging/updating | electron-builder 26.8.1, electron-updater 6.x, NSIS on Windows  |
| Backend            | Python 3.11.9, FastAPI, Pydantic 2, uvicorn, uv                 |
| GPU runtime        | Torch 2.10.0 + CUDA 13.0 with curated hardware-specific kernels |
| Generation runtime | Bundled WanGP `AiVS` branch head through an in-process `WanGPSession` |

## Top-level architecture

```text
React renderer
  ├─ HTTP + per-session auth token ──> FastAPI backend
  │                                  └─ in-process WanGP bridge
  │                                     └─ bundled Wan2GP runtime/models
  │
  └─ context-isolated preload ──────> Electron main process
                                     ├─ files, dialogs, project storage
                                     ├─ Python/runtime setup and supervision
                                     ├─ model-pack child process
                                     ├─ ffmpeg export/frame extraction
                                     └─ updater and application lifecycle
```

The renderer never imports Node or Electron APIs directly. Native access must go through the typed `window.electronAPI` bridge in `electron/preload.ts`.

## Main folders

| Path                         | Responsibility                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `frontend/`                  | React renderer, project state, GenSpace, Director, Video Editor, shared UI, types, and tests       |
| `frontend/views/genspace/`   | Current GenSpace implementation split by mode and responsibility                                   |
| `frontend/hooks/generation/` | Shared generation job lifecycle, request builders, progress normalisation, and tests               |
| `frontend/views/director/`   | Director workspace, preview, controls, timeline, persistence, and takes                            |
| `frontend/views/editor/`     | Video Editor implementation and timeline primitives shared visually with Director                  |
| `electron/`                  | Electron main process, preload bridge, IPC, project storage, setup, export, and updater            |
| `backend/`                   | FastAPI routes, domain handlers, services, state, model profiles, runtime configuration, and tests |
| `backend/model_profiles/`    | Backend-owned curated product model registry and image resolution policy                           |
| `scripts/`                   | Setup/build scripts, WanGP source management, and GPU stack installation                           |
| `docs/`                      | Current contracts plus completed implementation plans retained for history                         |
| `resources/`                 | App, installer, icon, and bootstrap resources                                                      |
| `Wan2GP/`                    | Bundled WanGP checkout sourced from the `AiVS` branch configured by `scripts/wangp-source.json`    |
| `.projectmem/`               | Curated current-state summary/map plus durable open issues and cross-task constraints              |

## Frontend map

### Application and project navigation

| Path                                   | Responsibility                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `frontend/main.tsx`                    | React root and Strict Mode                                                                                                  |
| `frontend/App.tsx`                     | App-level setup/readiness, shared backend/model-profile providers, and top-level routing                                    |
| `frontend/views/Home.tsx`              | Project home/create/open surface                                                                                            |
| `frontend/views/Project.tsx`           | Project header and Quick Gen / Director / Video Editor tabs                                                                 |
| `frontend/contexts/ProjectContext.tsx` | Single project-state owner exposing memoized navigation, list/meta, asset, Editor, Director, and GenSpace hand-off contexts |
| `frontend/types/project.ts`            | Project, asset, bin, take, generation metadata, and timeline persistence types                                              |

`Project.tsx` keeps all three workspaces mounted to preserve state. Inactive workspaces are hidden and must stop playback, keyboard shortcuts, media decoding, and compositor work.

`BackendLifecycleProvider` and `ModelProfilesProvider` own app-wide backend readiness and
curated profile loading. Existing focused hooks remain compatibility consumers; feature
surfaces must not create parallel lifecycle or profile pollers.

### GenSpace composition

`frontend/views/GenSpace.tsx` is intentionally only the route entry:

```text
GenSpace
└─ GenSpaceWorkspace
   ├─ useGenSpaceController
   │  ├─ persistent mode/settings/media state
   │  ├─ one shared useGeneration instance
   │  ├─ immutable submission snapshots
   │  ├─ result persistence/settings restoration
   │  └─ gallery state and actions
   ├─ GenSpaceGallery
   ├─ GenSpaceSidebar
   │  ├─ image/ImageGenPanel
   │  ├─ video/VideoGenPanel
   │  └─ music/MusicGenPanel
   └─ GenSpaceOverlays
```

Primary ownership:

| Area                              | Current owner                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| Composition                       | `frontend/views/genspace/GenSpaceWorkspace.tsx`                                               |
| Controller aggregation            | `frontend/views/genspace/hooks/useGenSpaceController.tsx`                                     |
| Mode transitions                  | `frontend/views/genspace/hooks/useGenSpaceModeState.ts`                                       |
| Image/video/music settings state  | `frontend/views/genspace/hooks/useGenSpaceSettingsState.ts`                                   |
| Prompt and attached media         | `frontend/views/genspace/hooks/useGenSpaceMediaInputs.ts`                                     |
| Reframe/Retake state              | `frontend/views/genspace/hooks/useGenSpaceVideoTools.tsx`                                     |
| Per-mode command construction     | `frontend/views/genspace/logic/generation-requests.ts`                                        |
| Submission snapshots/actions      | `frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts`                               |
| Generated asset construction      | `frontend/views/genspace/logic/generation-assets.ts`                                          |
| Completion/idempotent persistence | `frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts`                               |
| Copy Settings restoration         | `frontend/views/genspace/logic/settings-restore.ts` and `hooks/useGenSpaceSettingsRestore.ts` |
| Gallery state/actions             | `frontend/views/genspace/hooks/useGenSpaceGallery.ts`                                         |
| Gallery/overlay presentation      | `GenSpaceGallery.tsx` and `GenSpaceOverlays.tsx`                                              |
| Shared mode controls              | `frontend/views/genspace/components/`                                                         |
| Image-owned UI                    | `frontend/views/genspace/image/`                                                              |
| Video/Reframe/Retake-owned UI     | `frontend/views/genspace/video/`                                                              |
| Music-owned UI and compiler       | `frontend/views/genspace/music/`                                                              |

Mode panels receive typed controller contracts. They must not create their own project context, polling loop, persistence path, or `useGeneration` instance.

### Image generation

Curated visible profiles are backend-owned:

- `z_image_turbo` — Z-Image Turbo; one optional control input routes through the Z-Image control model.
- `krea2_turbo` — Krea 2 Turbo.
- `flux2_klein_4b` — Flux 2 Klein 4B; up to five curated reference/control inputs.
- `hidream_o1_dev` — HiDream O1; up to five curated reference/control inputs.

Key files:

- `frontend/views/genspace/image/ImageGenPanel.tsx`
- `frontend/views/genspace/image/ImageModelControls.tsx`
- `frontend/views/genspace/image/ImageMediaInputs.tsx`
- `backend/handlers/image_generation_handler.py`
- `backend/model_profiles/resolution_resolver.py`

The frontend submits profile IDs, aspect ratios, and resolution tiers. The backend validates the profile and resolves the exact output dimensions.

### Video generation

The visible curated video profile is:

- `ltx2_22b_distilled` — displayed as **LTX 2.3 Fast**, mapped to WanGP `ltx2_22B_distilled_1_1`.

Current video process modes:

- **Generate** — text-to-video plus curated start/end image, continuation, control-video, audio, and guidance roles supported by the selected profile.
- **Reframe** — trim plus aspect/zoom/pan outpainting workflow.
- **Retake** — visible but disabled.

Key files:

- `frontend/views/genspace/video/VideoGenPanel.tsx`
- `frontend/views/genspace/video/VideoModeTabs.tsx`
- `frontend/views/genspace/video/VideoMediaInputs.tsx`
- `frontend/views/genspace/video/GuideMediaTrimEditor.tsx`
- `frontend/views/genspace/video/ReframePanel.tsx`
- `frontend/views/genspace/video/OutpaintFrameOverlay.tsx`
- `frontend/views/genspace/video/VideoTrimPanel.tsx`
- `frontend/views/genspace/video/reframe-outpaint.ts`
- `backend/handlers/video_generation_handler.py`
- `backend/services/video_clip.py`
- `backend/services/reframe_wangp_mapping.py`

Multi-segment prompt timing is no longer authored in GenSpace. Director is the canonical prompt-timeline workflow; the backend retains legacy `shotPrompts` compatibility only.

### Music generation

Music generation is implemented through two curated ACE-Step 1.5 profiles:

- `ace_step_15_turbo` — **ACE-Step 1.5 Fast**
- `ace_step_15_xl_turbo` — **ACE-Step 1.5 XL**

Current capabilities include:

- Instrumental, Auto Lyrics, and Custom Lyrics modes.
- Song-description prompt with local Genre/Mood/Vibe/Instruments keyword chips.
- Generation-time description enhancement.
- Compose Lyrics with optional Think and independent lyric seed.
- Manual or automatic duration.
- BPM, key scale, time signature, language, vocal conditioning, variability, and sampling controls.
- Independent Cover Song and Transfer Timbre inputs.
- Up to four variations.
- Multi-variation audio assets rendered as independently previewable waveform rows.

Key files:

- `frontend/views/genspace/music/MusicGenPanel.tsx`
- `frontend/views/genspace/music/MusicSettings.tsx`
- `frontend/views/genspace/music/MusicAdvancedSettings.tsx`
- `frontend/views/genspace/music/MusicMediaInputs.tsx`
- `frontend/views/genspace/music/compile-music-request.ts`
- `frontend/views/genspace/music/music-keywords.ts`
- `frontend/types/music.ts`
- `backend/_routes/music_gen.py`
- `backend/handlers/music_generation_handler.py`
- `backend/services/music_request_resolver.py`
- `backend/services/audio_metadata.py`

The backend maps no audio/Cover/Timbre/both to WanGP audio tasks `""`, `A`, `B`, and `AB`. Legacy single-audio-input requests remain accepted for saved-generation compatibility.

### Shared generation lifecycle

`frontend/hooks/use-generation.ts` remains the compatibility facade used by GenSpace and Director.

`frontend/hooks/generation/useGenerationJob.ts` exclusively owns:

- the active generation state;
- one abort controller;
- the 500 ms polling loop;
- cancellation;
- terminal-state guards;
- unmount cleanup.

Pure request builders and progress formatters live alongside it in `frontend/hooks/generation/`.

GenSpace captures immutable, project-scoped submission snapshots. Completion persistence must use that snapshot rather than live UI state, so switching projects or modes during a job cannot save the result into the wrong project or apply later settings.

### Shared Asset Library

`frontend/components/GalleryAssetLibrary.tsx` is the controlled shared asset-library implementation used by GenSpace, Director, and Video Editor.

It owns the common:

- filter, favourite, bin, and view controls;
- grid/list rendering;
- media cards and type badges;
- multi-take navigation;
- audio waveform rows;
- hover preview behaviour;
- common context-action presentation.

Each workspace supplies only its data, selection, persistence, and workspace-specific callbacks.

Supporting files include:

- `frontend/lib/media-import.ts`
- `electron/lib/project-asset-import.ts`
- `electron/lib/project-asset-delete.ts`
- `frontend/lib/asset-copy.ts`
- `frontend/lib/asset-delete.ts`
- `frontend/lib/gallery-filters.ts`
- `frontend/components/GalleryBinBar.tsx`
- `frontend/views/editor/AssetContextMenu.tsx`
- `frontend/components/asset-library-virtual.ts`
- `frontend/lib/audio-decode-service.ts`
- `frontend/lib/video-thumbnail-service.ts`

GenSpace imports are copied to `{projectAssetsRoot}/{projectId}/uploads/`; generated outputs are moved to `generated/`. The Video Editor may still reference heavy editing imports in place.

Grid/list bodies use fixed-row virtualization with three-row overscan. Shared audio
envelopes and video thumbnail blob URLs are bounded renderer services; consumers request
enabled results and inactive workspaces release decode/media activity.

### Director V1

Director is a separate frame-based project workspace, not an alias for the NLE timeline.

Current V1 supports:

- multiple independent Director timelines per project;
- movable/resizable Prompt segments and authored gaps;
- Global Prompt plus local segment prompts;
- one Start/Centre/End image keyframe per Prompt segment;
- optional Continue Video prefix anchored at frame zero;
- 24 fps integer-frame authoring;
- output length snapped upward to `8n+1`;
- up to 20 seconds;
- independent playhead, preview, zoom, scroll, focus, and undo/redo;
- generated track and regeneration takes;
- output persistence into the shared Asset Library.

Guide Audio and Control Media tracks remain visible but locked.

Key files:

- `frontend/views/DirectorEditor.tsx`
- `frontend/views/director/`
- `frontend/types/director.ts`
- `frontend/lib/director-timeline.ts`
- `frontend/lib/director-validation.ts`
- `frontend/lib/director-request.ts`
- `frontend/views/editor/timeline/TimelinePrimitives.tsx`
- `backend/_routes/director.py`
- `backend/handlers/director_generation_handler.py`
- `backend/services/director_compiler.py`

### Video Editor

`frontend/views/VideoEditor.tsx` and `frontend/views/editor/` contain the inherited editing workspace. It remains a separate project tab and uses shared Asset Library presentation and shared domain-neutral timeline primitives where appropriate.

`frontend/views/VideoEditor.tsx` remains the domain, command, persistence, and playback
container. Focused owners under `frontend/views/editor/` include `EditorLayout`,
`EditorPreviewWorkspace`, `frontend/views/editor/EditorTimelinePanel.tsx`, `TimelineTrackHeaders`,
`TimelineTrackCanvas`, `EditorTimelineTabs`, `EditorTimelineToolRail`, and
`EditorInspector`.

`frontend/views/editor/playback-index.ts` builds immutable interval segments and O(1)
source maps. `usePlaybackEngine.ts` uses binary visual/dissolve/audio selectors and a
lazy media pool capped at three sources; inactive workspaces detach playback media.

Do not merge Director recipe objects into NLE `TimelineClip` objects. They deliberately use different time models and editing semantics.

### Settings, setup, and model management

Key files:

- `frontend/components/SettingsModal.tsx`
- `frontend/components/ModelPackManager.tsx`
- `frontend/components/PythonSetup.tsx`
- `frontend/components/DownloadProgressView.tsx`
- `electron/python-setup.ts`
- `electron/app-state.ts`
- `backend/wangp_model_packs.py`
- `frontend/types/progress.ts`
- `backend/progress_types.py`

Settings uses persistent left navigation for General, Model Manager, Advanced, and About. Model-pack states are communicated inline as missing, selected, downloading, ready, or failed.

Generation-triggered model downloads flow through backend generation progress. Setup/Model Manager downloads flow through Electron IPC. Both are normalised to the same renderer transfer shape without collapsing structured filename/counter details.

## Backend map

### Composition and route pattern

```text
backend/ltx2_server.py
  └─ backend/app_factory.py
      └─ backend/app_handler.py
          ├─ state
          ├─ domain handlers
          └─ services / WanGP bridge
```

Routes stay thin:

```text
_routes/* -> AppHandler -> handlers/* -> services/* + state/*
```

`AppHandler` is the composition root and owns the shared `RLock`, application state, WanGP bridge, and typed domain handlers.

Heavy work must not hold the shared lock. The expected pattern is:

```text
lock -> read/validate/update state -> unlock
heavy GPU/IO work
lock -> publish result/error -> unlock
```

### Main API routes

| Endpoint                                    | Owner                       |
| ------------------------------------------- | --------------------------- |
| `POST /api/generate-image`                  | `ImageGenerationHandler`    |
| `POST /api/generate`                        | `VideoGenerationHandler`    |
| `POST /api/generate-music`                  | `MusicGenerationHandler`    |
| `POST /api/music/compose-lyrics`            | `MusicGenerationHandler`    |
| `POST /api/director/generate`               | `DirectorGenerationHandler` |
| `POST /api/enhance-prompt`                  | `PromptEnhancementHandler`  |
| `GET /api/generation/progress`              | shared `GenerationHandler`  |
| `POST /api/generate/cancel`                 | shared `GenerationHandler`  |
| `GET /api/model-profiles`                   | `ModelProfilesHandler`      |
| health/settings/retake compatibility routes | their matching handlers     |

`backend/app_factory.py` owns CORS, per-session auth middleware, route registration, and exception/logging boundaries.

### Important backend files

| Path                                              | Responsibility                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `backend/api_types.py`                            | Pydantic HTTP contracts                                                 |
| `backend/state/`                                  | discriminated state types, settings, and dependency access              |
| `backend/handlers/generation_handler.py`          | shared job/progress/cancel state                                        |
| `backend/handlers/image_generation_handler.py`    | image profile validation and WanGP mapping                              |
| `backend/handlers/video_generation_handler.py`    | video, continuation, controls, and Reframe mapping                      |
| `backend/handlers/music_generation_handler.py`    | ACE-Step request resolution, lyric composition, generation, and outputs |
| `backend/handlers/director_generation_handler.py` | semantic Director validation and generation                             |
| `backend/handlers/model_profiles_handler.py`      | curated profile API and availability                                    |
| `backend/services/wangp_bridge.py`                | in-process WanGP session, manifest execution, progress normalisation    |
| `backend/model_profiles/profiles.py`              | product-facing model source of truth                                    |
| `backend/wangp_model_packs.py`                    | model-pack discovery/download/delete without GPU model loading          |
| `backend/tests/fakes/fake_wangp_bridge.py`        | test boundary for WanGP side effects                                    |

Tests use service fakes rather than `unittest.mock`.

## Curated model contract

WanGP discovery answers what exists and whether files are available. AiVS decides what appears in the product.

Visible profiles currently are:

| Media | AiVS profile IDs                                                   |
| ----- | ------------------------------------------------------------------ |
| Image | `z_image_turbo`, `krea2_turbo`, `flux2_klein_4b`, `hidream_o1_dev` |
| Video | `ltx2_22b_distilled`                                               |
| Music | `ace_step_15_turbo`, `ace_step_15_xl_turbo`                        |

Rules:

- The renderer consumes `GET /api/model-profiles`; it does not scrape WanGP.
- The backend validates profile IDs and curated options before invoking WanGP.
- Raw WanGP metadata remains separate from product capabilities.
- Adding raw metadata or a model-pack entry does not automatically expose a new UI profile.
- TTS is represented in shared types as a future media type but has no visible profile/workflow.

## Electron map

| Path                                   | Responsibility                                                      |
| -------------------------------------- | ------------------------------------------------------------------- |
| `electron/main.ts`                     | single-instance lifecycle, handler registration, startup/shutdown   |
| `electron/window.ts`                   | BrowserWindow creation and renderer loading                         |
| `electron/preload.ts`                  | typed, context-isolated renderer API                                |
| `electron/ipc/`                        | file, app, project, video-processing, logging, and storage handlers |
| `electron/app-state.ts`                | per-user project/checkpoint/LoRA path settings                      |
| `electron/python-setup.ts`             | Python/GPU runtime setup, model-pack process, backend readiness     |
| `electron/python-backend.ts`           | backend process supervision                                         |
| `electron/lib/project-asset-import.ts` | project upload/generated asset movement and duplicate policy        |
| `electron/export/`                     | native ffmpeg export                                                |
| `electron/updater.ts`                  | GitHub release update checks                                        |
| `electron-builder.yml`                 | packaged resources and Windows/macOS targets                        |

Native filesystem operations must validate or explicitly approve paths before reading, copying, deleting, or exposing them.

## WanGP source and GPU runtime

Current source manifest:

- Repository: `GOvEy1nw/Wan2GP`
- Branch: `AiVS`
- Tracking: latest remote branch head; no commit or `wangpVersion` gate

Source-of-truth files:

- `scripts/wangp-source.json`
- `scripts/ensure-wan2gp.ps1` / `.sh`
- `scripts/update-wangp.ps1`
- `backend/WANGP_BACKEND.md`

Update scripts compare the fork branch, report sensitive changes, validate its current head, and roll back the checkout when validation fails. Runtime dependency pins remain reproducible separately from the floating source branch.

Current Windows GPU stack:

- Python 3.11.9
- Torch 2.10.0
- torchvision 0.25.0
- torchaudio 2.10.0
- CUDA 13.0 index
- GPU-generation-specific Triton/SageAttention/Sparge/Flash/Nunchaku/GGUF/LightX2V wheels

Canonical files:

- `backend/pyproject.toml`
- `backend/uv.lock`
- `scripts/wangp-stacks.json`
- `scripts/install-wangp-stack.ps1`

Do not bulk-upgrade or automate this stack as ordinary Python dependencies. It is one curated compatibility unit tied to WanGP, CUDA, Python ABI, GPU generation, and available wheels.

## Storage and runtime locations

- Default project asset root: `Documents/AiVS`
- Imported project assets: `{root}/{projectId}/uploads/`
- Generated project assets: `{root}/{projectId}/generated/`
- Per-user executable/cache/update state: Electron user-data directory
- Checkpoint and LoRA roots: defaults from the runtime, optionally overridden through app state
- Backend staging/output paths: runtime-owned and copied/moved into project storage after successful generation

## Testing and validation map

### Commands

| Command                    | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `pnpm dev`                 | Start Vite, Electron, and the Python backend          |
| `pnpm dev:debug`           | Start with Electron and Python debugging              |
| `pnpm typecheck:ts`        | Strict TypeScript                                     |
| `pnpm typecheck:py`        | Strict Pyright                                        |
| `pnpm typecheck`           | Both type checks                                      |
| `pnpm test:frontend`       | Full Vitest suite                                     |
| `pnpm test:frontend:watch` | Watch-mode frontend tests                             |
| `pnpm backend:test`        | Backend pytest suite                                  |
| `pnpm build:frontend`      | Renderer, Electron main, and preload production build |
| `pnpm build:fast:win`      | Unpacked Windows build without rebuilding Python      |
| `pnpm build:win`           | Full Windows installer build                          |
| `pnpm wangp:check`         | Compare the checkout with the current fork branch head |
| `pnpm wangp:update`        | Validate and adopt the current fork branch head        |
| `pnpm wangp:update:full`   | WanGP update plus full validation                     |

### Test ownership

- Frontend focused tests live beside extracted GenSpace components/hooks/logic and under `frontend/hooks/generation/`.
- Backend integration tests live in `backend/tests/`.
- Backend tests use real FastAPI app wiring with fake heavy services.
- Pyright runs independently through `pnpm typecheck:py`; pytest does not enforce it.
- Director, Reframe, model-profile, music, model-pack, progress, source-pin, and bridge contracts have dedicated test coverage.

Validation evidence belongs in its Backlog task and commit/CI history. Rerun the
narrowest current checks required by the affected layer; this map does not preserve
historical pass counts.

## Current constraints and risks

- **Primary platform:** Windows 10/11 with NVIDIA RTX hardware. Other platforms are secondary/source-development targets.
- **Runtime floor:** current Windows stack requires NVIDIA driver 580+.
- **Native file boundary:** Electron 43 resolves dropped-file paths only through the narrow preload `webUtils.getPathForFile(file)` bridge; renderer `File.path` casts are forbidden.
- **Installer signing:** the current Windows installer is not Authenticode-signed.
- **Retake:** route/legacy structures exist, but the user-facing workflow remains disabled.
- **Manual media QA:** drag/drop, waveform/video playback, seeking, Reframe geometry, real model download, and generation output still require native Electron checks.
- **Agent capture caveat:** some managed Windows agents cannot capture the app because `GetCursorPos` is denied; treat that as a tooling limitation, not an app failure.
- **No cloud fallback:** generation must remain local and WanGP-only.

## Active roadmap

Near-term work should be tracked by current implementation plans, not the old numbered phase table.

Current known directions:

1. Real-runtime regression testing for image, video, Reframe, Director, music, and model-download workflows.
2. Retake when the WanGP integration is reliable enough to expose.
3. User-facing LoRA selection and strength controls.
4. TTS generation.
5. Later Director Guide Audio and Control Media authoring.
6. Continued curated model additions through backend profiles and model packs.

## Documentation source-of-truth order

Read these first:

1. `AGENTS_PRD.md` — product principles and non-negotiable local/WanGP direction.
2. `AGENTS.md` — coding conventions and validation commands.
3. `.projectmem/PROJECT_MAP.md` — current ownership/navigation.
4. `.projectmem/summary.md` — concise current state, decisions, and active constraints.
5. `docs/GENSPACE_ARCHITECTURE.md` — current GenSpace ownership model.
6. `docs/GENSPACE_REFACTOR_PARITY_CHECKLIST.md` — completed split parity evidence.
7. `docs/DIRECTOR_MODE_V1.md` — current Director product contract.
8. `docs/REFRAME_MODE.md` — current Reframe contract.
9. `backend/architecture.md` — backend design rules.
10. `backend/WANGP_BACKEND.md` — bundled WanGP/source-update contract.
11. `scripts/wangp-source.json` and `scripts/wangp-stacks.json` — source branch and exact runtime-stack configuration.

Completed implementation plans such as the full GenSpace split and Music V2 plan are historical records. Do not execute their unchecked phase language again unless a current task explicitly reopens that work.

## Maintenance rule for this map

Update this file when code ownership, visible product capabilities, runtime pins, or major
constraints change. Do not append individual bug-fix stories or completed task
transcripts; those belong in Backlog and Git history. ProjectMem issues retain only
durable open defects and cross-task constraints that meet the retention rubric.
