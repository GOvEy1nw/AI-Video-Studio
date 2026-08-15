# Project Map - AI-Video-Studio

## Project purpose

AiVS is a local-first Electron desktop application for project-based AI image, video, music, and sound-effect creation. It gives Windows/NVIDIA users curated Quick Gen, Director, Video Editor, and Asset Library workflows backed exclusively by the bundled local WanGP/Wan2GP runtime.

## Stack

- TypeScript, React, Vite, Tailwind CSS, Electron, and Vitest for the desktop shell and renderer.
- Python 3.11+, FastAPI, Pydantic, PyTorch 2.10, uv, and pytest for the local generation backend.
- Node 24 and pnpm 10.30.3 are the supported JavaScript toolchain.
- Windows with NVIDIA RTX hardware is the primary runtime and packaging target.

## Entry points

- `frontend/main.tsx` — mounts the React renderer.
- `frontend/App.tsx` — composes app-wide providers, setup, backend status, home, and project views.
- `electron/main.ts` — starts the Electron lifecycle, native handlers, updater, and supervised Python backend.
- `electron/preload.ts` — exposes the context-isolated native API to the renderer.
- `backend/ltx2_server.py` — builds the authenticated FastAPI app and starts Uvicorn on loopback.

## Structure

- `AGENTS.md` — authoritative product, architecture, safety, workflow, and validation rules.
- `README.md` — user-facing product status, supported workflows, setup, and release requirements.
- `package.json` — Node/pnpm versions and supported dev, test, build, packaging, and WanGP maintenance commands.
- `electron-builder.yml` — desktop packaging configuration.
- `vite.config.ts` — renderer, Electron main, and preload bundling configuration.
- `frontend/` — React renderer.
  - `frontend/main.tsx` — renderer bootstrap.
  - `frontend/App.tsx` — top-level providers and app navigation.
  - `frontend/views/Project.tsx` — project workspace shell; preserves visited Quick Gen, Director, and Editor workspaces while inactive.
  - `frontend/contexts/ProjectContext.tsx` — project, asset, timeline, Director document, navigation, and persistence owner.
  - `frontend/contexts/project-persistence-queue.ts` — serializes native project persistence work.
  - `frontend/contexts/BackendLifecycleContext.tsx` — backend connection and process lifecycle state.
  - `frontend/contexts/ModelProfilesContext.tsx` — consumes backend-owned curated model profiles.
  - `frontend/lib/backend.ts` — authenticated renderer HTTP boundary using the Electron-provided URL and token.
  - `frontend/components/GalleryAssetLibrary.tsx` — shared project Asset Library surface.
  - `frontend/views/genspace/` — Quick Gen image, video, music, and sound-effect UI.
    - `frontend/views/genspace/GenSpaceWorkspace.tsx` — Quick Gen composition root.
    - `frontend/views/genspace/hooks/useGenSpaceController.tsx` — persistent Quick Gen state and orchestration.
    - `frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts` — project-scoped generation result persistence.
    - `frontend/views/genspace/logic/` — pure request, media-input, framing, restoration, and mode-transition logic.
    - `frontend/views/genspace/components/` — shared generation controls and media inputs.
    - `frontend/views/genspace/image/`, `frontend/views/genspace/video/`, `frontend/views/genspace/music/`, `frontend/views/genspace/audio/` — mode-specific presentation and compilation.
  - `frontend/hooks/generation/useGenerationJob.ts` — shared active-job, progress, cancellation, terminal-state, and cleanup lifecycle.
  - `frontend/views/DirectorEditor.tsx` — Director workspace root.
  - `frontend/views/director/` — Director sequence state, preview, inspector, prompt segments, and timeline UI.
  - `frontend/views/VideoEditor.tsx` — Video Editor workspace root.
  - `frontend/views/editor/` — playback, timeline, monitors, inspector, edit operations, subtitles, regeneration, and editor layout.
  - `frontend/types/` — renderer domain types for projects, generation, profiles, Director, music, SFX, and video tools.
- `shared/` — contracts shared across renderer and Electron.
  - `shared/electron-api.ts` — typed `window.electronAPI` security boundary.
- `electron/` — desktop lifecycle and native capabilities.
  - `electron/main.ts` — application composition and IPC registration.
  - `electron/preload.ts` — narrow context bridge implementation.
  - `electron/window.ts` — BrowserWindow creation and access.
  - `electron/python-backend.ts` — local backend launch, supervision, URL/token publication, restart, and shutdown.
  - `electron/python-setup.ts` — bundled Python/WanGP setup and runtime readiness.
  - `electron/project-storage.ts` — versioned project index and atomic serialized persistence.
  - `electron/path-validation.ts` — canonical path validation and containment checks.
  - `electron/ipc/` — domain-specific app, file, project-storage, logging, and video-processing handlers.
  - `electron/lib/project-asset-import.ts` — approved project media import and duplicate handling.
  - `electron/lib/project-asset-delete.ts` — constrained project asset deletion.
  - `electron/export/` — ffmpeg timeline flattening, audio mixing, filters, and export handling.
  - `electron/updater.ts` — application update lifecycle.
- `backend/` — authenticated local FastAPI service and WanGP adapter.
  - `backend/pyproject.toml` and `backend/uv.lock` — pinned Python/GPU runtime and development dependencies.
  - `backend/ltx2_server.py` — runtime configuration, FastAPI construction, loopback server, and startup.
  - `backend/app_factory.py` — HTTP application and middleware construction.
  - `backend/app_handler.py` — dependency composition root, shared state owner, and handler wiring.
  - `backend/_routes/` — thin typed HTTP adapters for health, settings, profiles, generation, Director, retake, music, and SFX.
  - `backend/handlers/` — domain validation, state transitions, and orchestration.
  - `backend/state/` — typed application settings, dependencies, and generation/startup/model state.
  - `backend/services/wangp_bridge.py` — sole normal generation bridge into local WanGP/Wan2GP.
  - `backend/services/` — generation compilation, media transforms, download/runtime helpers, and other heavy side effects.
  - `backend/model_profiles/profiles.py` — stable curated-profile facade, combined validation, and lookup/visibility API.
  - `backend/model_profiles/types.py` — shared profile dataclasses, aliases, input roles, and setting-value construction.
  - `backend/model_profiles/image_profiles.py` — curated image profile definitions and image metadata helpers.
  - `backend/model_profiles/video_profiles.py` — curated video profile templates, Base/Turbo variants, and pack bindings.
  - `backend/model_profiles/audio_profiles.py` — curated speech, sound-effect, and music profile definitions.
  - `backend/api_types.py` and `backend/progress_types.py` — typed backend API and progress contracts.
  - `backend/tests/` — focused backend contract and integration tests with lightweight fakes.
- `scripts/` — supported setup, validation, build, packaging, and WanGP source/runtime workflows.
  - `scripts/setup-dev.ps1` — Windows development setup.
  - `scripts/local-build.ps1` — supported Windows unpacked/installer build workflow.
  - `scripts/update-wangp.ps1` — transactional managed WanGP source update.
  - `scripts/wangp-source.json` — managed WanGP repository/branch source configuration.
  - `scripts/wangp-stacks.json` — curated GPU runtime compatibility stacks.
  - `scripts/check-dependency-boundaries.mjs` — package-manager and dependency-boundary checks.
- `Wan2GP/` — managed WanGP checkout; generated through repository scripts rather than edited as an independent runtime.
- `resources/` and `public/` — installer resources, icons, splash media, and renderer assets.
- `backlog/` — Backlog.md configuration and actionable task records.
- `.projectmem/` — persistent decisions, issues, attempts, fixes, project map, and generated summary.

## Relationships

- `frontend/main.tsx` mounts `frontend/App.tsx`, which installs app providers and routes project work into `frontend/views/Project.tsx`.
- `frontend/views/Project.tsx` lazily loads but keeps visited Quick Gen, Director, and Video Editor workspaces mounted; each workspace receives an `isActive` boundary for expensive work and shortcuts.
- `frontend/views/genspace/GenSpaceWorkspace.tsx` delegates state and orchestration to `frontend/views/genspace/hooks/useGenSpaceController.tsx`, which reuses `frontend/hooks/generation/useGenerationJob.ts` for the shared job lifecycle.
- Renderer generation and profile requests call `frontend/lib/backend.ts`, which uses the URL and per-session token supplied by Electron to reach `backend/ltx2_server.py`.
- `backend/ltx2_server.py` creates the app through `backend/app_factory.py`; `backend/_routes/` call the `backend/app_handler.py` composition root, which delegates to `backend/handlers/` and `backend/services/`.
- Generation handlers route normal inference through `backend/services/wangp_bridge.py` into the managed `Wan2GP/` checkout; the renderer and Electron main process do not run inference directly.
- `backend/model_profiles/profiles.py` defines curated capabilities, `backend/_routes/model_profiles.py` exposes them, and `frontend/contexts/ModelProfilesContext.tsx` supplies them to product controls.
- `frontend/contexts/ProjectContext.tsx` queues persistence through `frontend/contexts/project-persistence-queue.ts`, calls the typed API from `shared/electron-api.ts`, and reaches `electron/ipc/project-storage-handlers.ts` plus `electron/project-storage.ts`.
- `electron/main.ts` starts `electron/python-backend.ts`, registers domain IPC handlers, and creates the window; `electron/preload.ts` exposes only the matching methods declared in `shared/electron-api.ts`.
- Director and Video Editor read and update shared project assets and timelines through `frontend/contexts/ProjectContext.tsx`; completed media remains project-owned and available through `frontend/components/GalleryAssetLibrary.tsx`.
- Video Editor export crosses `shared/electron-api.ts` and `electron/preload.ts` into `electron/export/`, where ffmpeg work runs outside the renderer.
- Windows setup and packaging use `scripts/setup-dev.ps1` and `scripts/local-build.ps1`, which consume the pinned runtime definitions in `backend/uv.lock`, `scripts/wangp-stacks.json`, and `scripts/wangp-source.json`.
