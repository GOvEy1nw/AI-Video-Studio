# Project Map — AI Video Studio

Status: Populated by AI session on 2026-07-03 from AGENTS_PRD.md + codebase analysis.

## Project purpose

AI Video Studio is a local-first desktop app for AI image, video, and audio generation. Forked from `deepbeepmeep/LTX-Desktop-WanGP`, it is being reshaped from an LTX-model-centric video editor into a Freepik/Higgsfield-style creative studio powered exclusively by WanGP. Free and community-focused, not commercial.

## Stack

- **Frontend**: React 18 + TypeScript 5.4 + Vite 5 + Tailwind CSS 3.4
- **Electron**: Electron 31 main process (TypeScript), context-isolated preload (CommonJS)
- **Backend**: Python 3.12+ + FastAPI + uvicorn (port 8000)
- **Package manager**: pnpm 10
- **Packaging**: electron-builder (NSIS/Windows, DMG/macOS)
- **CI**: GitHub Actions — `pnpm typecheck` + `pnpm backend:test` + frontend build
- **Testing**: pytest (backend, integration-first, mock-free via service fakes), no frontend tests
- **Key Python deps**: torch 2.3+, diffusers, ltx-core, ltx-pipelines, huggingface-hub, pynvml
- **Key Node deps**: react, react-dom, lucide-react, react-dropzone, clsx, tailwind-merge, class-variance-authority, electron-updater, js-yaml

## Architecture (three layers)

```
Renderer (React + TS)  ──HTTP localhost:8000──>  Backend (FastAPI + Python)
       │
       └──IPC (preload: window.electronAPI)──>  Electron main (TS)
                                                     │
                                                     └── OS (files, dialogs, ffmpeg, process mgmt)
```

- **Renderer** is sandboxed (`contextIsolation: true`, `nodeIntegration: false`). Calls backend directly via HTTP and Electron via preload bridge.
- **Electron main** owns app lifecycle, OS integration (file dialogs, ffmpeg export), and Python backend process management.
- **Backend** orchestrates generation, model downloads, GPU execution. Calls WanGP in-process via `WanGPBridge` (`services/wangp_bridge.py`).

## Main folders

- `frontend/` — React renderer (views, components, contexts, hooks, lib, types, styles)
- `electron/` — Electron main process + preload (app lifecycle, IPC handlers, export, python-backend supervision, analytics, updater)
- `backend/` — Python FastAPI server (routes, handlers, services, state, tests, runtime config)
- `scripts/` — Dev setup scripts (setup-dev.sh, setup-dev.ps1, prepare-python, local-build)
- `docs/` — Documentation (CONTRIBUTING, INSTALLER, TELEMETRY)
- `resources/` — Build resources (icons, installer.nsh, entitlements.plist)
- `public/` — Static public assets (splash screen, favicon)
- `.github/workflows/` — CI/CD workflows
- `.projectmem/` — Project memory layer (mandatory for AI agents)

## Frontend structure (`frontend/`)

### Views (primary UI surfaces)
| File | Purpose |
| --- | --- |
| `views/Home.tsx` | Landing page: project list, playback menu, startup flow |
| `views/GenSpace.tsx` | QuickGen/generation space — the primary target for MVP adaptation. Already has prompt, model selection, resolution, reference input, generation/cancel/progress, gallery output cards |
| `views/VideoEditor.tsx` | Full video editor with timeline, tracks, clips, subtitles, gap fill, retake. Bonus, not MVP centre — keep, do not rewrite |
| `views/SettingsModal.tsx` | App settings modal (API keys, model settings, text encoding, analytics) |
| `views/Playground.tsx` | Experimental playground view |

### Components
Key reusable UI components organized by domain: `AssetActionsButton`, `AssetDeleteButton`, `AssetDialogs`, `AssetHeader`, `AssetMetadata`, `AssetSizeDisplay`, `AssetStatusIcon`, `AssetTakesDropdown`, `AspectRatioSelector`, `AudioPlayer`, `Dialog`, `DurationSelector`, `Gallery`, `GenerationCard`, `GenerationSettings`, `Header`, `ImagePreview`, `LoRAIndicator`, `ModelSelector`, `PromptInput`, `ReferenceInput`, `SeedControl`, `SettingsField`, `Sidebar`, `Spinner`, `StatusOverlay`, `TabNavigation`, `Toast`, `Tooltip`, plus editor-specific components.

### Contexts (state management — no Redux/Zustand)
| Context | Purpose |
| --- | --- |
| `contexts/ProjectContext.tsx` | Projects, assets, timelines, view routing (home/project/playground), favorites, editor↔gen-space bridge |
| `contexts/AppSettingsContext.tsx` | Global app settings (API keys, model config, text encoding, analytics) |
| `contexts/KeyboardShortcutsContext.tsx` | Keyboard shortcut bindings |

### Types
| File | Purpose |
| --- | --- |
| `types/project.ts` | Project, Asset, AssetTake, Timeline, ViewType, ProjectTab, and generation-related types |
| `types/generation.ts` | Generation request/response types, progress types |
| `types/editor.ts` | Video editor types (tracks, clips, subtitles) |

### Key frontend files
- `lib/api.ts` — HTTP client for backend API calls
- `lib/asset-copy.ts` — Asset file management
- `lib/logger.ts` — Frontend logging
- `lib/utils.ts` — General utilities (cn() for Tailwind)
- `hooks/use-generation.ts` — Generation hook (submit, cancel, progress polling)
- `hooks/use-backend-status.ts` — Backend health/status polling
- `vite-env.d.ts` — Vite type declarations including `window.electronAPI`

## Electron structure (`electron/`)

| File | Purpose |
| --- | --- |
| `main.ts` | Entry point — app lifecycle, window creation, IPC registration, single-instance lock |
| `preload.ts` | Context bridge (`contextBridge.exposeInMainWorld`) — exposes `window.electronAPI` |
| `python-backend.ts` | Manages Python backend process lifecycle (start, stop, health check, port detection) |
| `app-state.ts` | Electron-side app state management |
| `config.ts` | Runtime config for Electron (env vars, paths, settings) |
| `analytics.ts` | **TO REMOVE** — Anonymous usage analytics (PostHog) |
| `updater.ts` | Auto-updater (electron-updater, GitHub releases) |
| `csp.ts` | Content Security Policy setup |
| `logging-management.ts` | Session log management (backend stdout/stderr routing) |
| `app-paths.ts` | App data folder paths |
| `window.ts` | BrowserWindow creation and management |
| `ipc/app-handlers.ts` | IPC: app info, open external, get app data path |
| `ipc/file-handlers.ts` | IPC: file dialogs, read/write, copy, resolve paths |
| `ipc/log-handlers.ts` | IPC: session log retrieval |
| `ipc/video-processing-handlers.ts` | IPC: video processing (thumbnail gen, metadata) |
| `export/ffmpeg-utils.ts` | ffmpeg export processes |
| `export/export-handler.ts` | IPC: export orchestration |

## Backend structure (`backend/`)

### Routes (`_routes/`) — thin API surface, no business logic
| File | Endpoints |
| --- | --- |
| `_routes/health.py` | `GET /health`, `GET /state` |
| `_routes/generation.py` | `POST /api/generate` (video), `POST /api/generate-image`, `POST /api/cancel` |
| `_routes/models.py` | Model download/status endpoints |
| `_routes/downloads.py` | Download progress endpoints |
| `_routes/settings.py` | Settings CRUD endpoints |
| `_routes/text.py` | Text encoding endpoints |
| `_routes/retake.py` | Retake (video edit) endpoints |
| `_routes/ic_lora.py` | IC-LoRA endpoints |
| `_routes/suggest.py` | Prompt suggestion endpoint (Gemini) |

### Handlers — business logic + state transitions
| File | Responsibility |
| --- | --- |
| `handlers/generation_handler.py` | Shared generation state machine (running/complete/error/cancelled) |
| `handlers/video_generation_handler.py` | Video gen: WanGP vs local pipeline routing, LTX API fallback path **to remove** |
| `handlers/image_generation_handler.py` | Image gen: WanGP vs ZIT pipeline routing, fal.ai fallback **to remove** |
| `handlers/health_handler.py` | System health: GPU, models, WanGP, text encoder status |
| `handlers/models_handler.py` | Model discovery, availability, refresh |
| `handlers/downloads_handler.py` | Model download lifecycle |
| `handlers/text_handler.py` | Text encoding (local or cloud — cloud path **to remove**) |
| `handlers/pipelines_handler.py` | Pipeline lifecycle (load/unload GPU pipelines) |
| `handlers/settings_handler.py` | Settings persistence |
| `handlers/retake_handler.py` | Retake (video edit gen) — LTX API, **to disable/remove** |
| `handlers/ic_lora_handler.py` | IC-LoRA generation |
| `handlers/suggest_gap_prompt_handler.py` | Gemini prompt suggestion — **to remove** |
| `handlers/runtime_policy_handler.py` | Runtime policy checks |

### Services — heavyside effects boundary (protocols + real + fake implementations)
| Service | Real impl | Notes |
| --- | --- | --- |
| `wangp_bridge.py` | In-process WanGP API bridge (`shared.api.WanGPSession`) | **Core for MVP** |
| `http_client/` | `HTTPClientImpl` | HTTP with retries |
| `ltx_api_client/` | `LTXAPIClientImpl` | LTX cloud API — **to remove** |
| `zit_api_client/` | `ZitAPIClientImpl` | fal.ai Z-Image Turbo — **to remove** |
| `text_encoder/` | `LTXTextEncoder` | Local + cloud encoding — cloud path **to remove** |
| `fast_video_pipeline/` | `LTXFastVideoPipeline` | Local LTX video gen — **keep/refactor for WanGP-only** |
| `image_generation_pipeline/` | `ZitImageGenerationPipeline` | ZIT image gen — **to remove** |
| `ic_lora_pipeline/` | `LTXIcLoraPipeline` | IC-LoRA gen |
| `ic_lora_model_downloader/` | `IcLoraModelDownloaderImpl` | IC-LoRA model downloads |
| `a2v_pipeline/` | `LTXa2vPipeline` | Audio-to-video pipeline |
| `retake_pipeline/` | `LTXRetakePipeline` | Retake edit gen — **to disable/remove** |
| `model_downloader/` | `HuggingFaceDownloader` | HF model downloads |
| `gpu_info/` | `GpuInfoImpl` | GPU telemetry (pynvml) |
| `gpu_cleaner/` | `TorchCleaner` | GPU memory cleanup |
| `video_processor/` | `VideoProcessorImpl` | Video thumbnail/crop/transcode |
| `task_runner/` | `ThreadingRunner` | Background task execution |

### State (`state/`)
- `app_state_types.py` — `AppState` with discriminated union types for state machines
- `app_settings.py` — `AppSettings` model
- `deps.py` — FastAPI dependency injection (`get_state_service`, test overrides)

### Key backend files
- `ltx2_server.py` — Runtime bootstrap (logging, RuntimeConfig, AppHandler, uvicorn)
- `app_factory.py` — FastAPI app factory (routers, DI, exception handling, CORS)
- `app_handler.py` — `AppHandler` composition root + `ServiceBundle` + `build_initial_state()`
- `api_types.py` — Pydantic request/response models
- `architecture.md` — Backend architecture documentation
- `WANGP_BACKEND.md` — WanGP bridge configuration guide
- `runtime_config/runtime_config.py` — `RuntimeConfig` dataclass (paths, device, WanGP settings, model types)

### Tests (`tests/`)
Integration-style tests with Starlette `TestClient`, mock-free (service fakes only):
- `tests/conftest.py` — Fresh `AppHandler` per test with fake services
- `tests/fakes/` — Fake service implementations
- `tests/test_generation.py` — Generation endpoint tests
- `tests/test_no_mock_usage.py` — Enforcement: no `unittest.mock` usage
- `tests/test_pyright.py` — Pyright strict mode enforcement

## Scripts

| Script | Purpose |
| --- | --- |
| `scripts/setup-dev.ps1` | Windows dev setup: clones Wan2GP, installs backend deps, sets up venv |
| `scripts/setup-dev.sh` | macOS/Linux dev setup |
| `scripts/local-build.ps1` | Windows installer build |
| `scripts/local-build.sh` | macOS installer build |
| `scripts/prepare-python.ps1` / `.sh` | Python embed preparation for bundling |

## Configuration files

| File | Purpose |
| --- | --- |
| `package.json` | Node project config (name: `aivs`, version 0.1.0) |
| `settings.json` | Default app settings |
| `electron-builder.yml` | Build/packaging config (productName: `AiVS`, appId: `ai.video.studio`) |
| `tsconfig.json` | Root TypeScript config |
| `tsconfig.node.json` | Node/Electron TypeScript config |
| `tsconfig.web.json` | Frontend TypeScript config |
| `backend/pyproject.toml` | Python project config (name: `aivs-backend`, version 0.1.0) |
| `backend/pyrightconfig.json` | Pyright strict mode config |
| `vite.config.ts` | Vite build config (electron plugin, aliases) |
| `tailwind.config.ts` | Tailwind CSS config |
| `postcss.config.js` | PostCSS config |
| `.gitignore` | Git ignore rules (includes Wan2GP/, backend/.venv/, models/, outputs/) |

## Suggested first reads (for new contributors/AI agents)

1. **AGENTS_PRD.md** — Product vision, scope, guardrails. Read this first.
2. `AGENTS.md` — Agent instructions + codebase conventions
3. `docs/PHASE0_AUDIT.md` — Fork audit: keep/remove/extend map of the full codebase
4. `backend/architecture.md` — Backend architecture deep-dive
5. `backend/app_handler.py` — Composition root: see how everything wires together
6. `frontend/views/GenSpace.tsx` — Main generation UI (primary QuickGen surface)
7. `frontend/contexts/ProjectContext.tsx` — State management and routing
8. `backend/services/wangp_bridge.py` — WanGP integration (the core generation path)
9. `electron/python-backend.ts` — How the Python backend is managed
10. `.projectmem/summary.md` — Current project memory snapshot
11. This file (`PROJECT_MAP.md`)

## Key relationships

- **GenSpace UX → Backend routes**: GenSpace.tsx calls `POST /api/generate-image` which hits `ImageGenerationHandler` → WanGP bridge
- **WanGP bridge → Wan2GP**: `WanGPBridge` imports WanGP's `shared.api.WanGPSession` and calls it in-process
- **Electron → Python backend**: `electron/python-backend.ts` spawns `uvicorn` as a child process, monitors health
- **Renderer → Electron**: All IPC through `window.electronAPI` defined in `electron/preload.ts`
- **Renderer → Backend**: Direct HTTP to `http://localhost:8000` (CORS enabled for dev)
- **AppHandler → Services**: Handlers call service interfaces; real implementations injected at runtime, fakes in tests
- **ProjectContext → views**: Single source of truth for currentView, projects, assets — consumed by all views

## Phased development roadmap (from PRD)

| Phase | Goal | Status |
| --- | --- | --- |
| Phase 0 | Fork audit + preservation map | **Complete** |
| Phase 1 | Local-only product shell (rebrand to AiVS, remove cloud UI) | **Complete** |
| Phase 2 | WanGP-only generation enforcement | **Complete** |
| Phase 3 | QuickGen image baseline (1 model end-to-end) | **Complete** |
| Phase 4 | Curated image model expansion | Pending |
| Phase 5 | LoRA MVP | Pending |
| Phase 6 | QuickGen image polish | Pending |
| Phase 7 | QuickGen video | Pending |
| Phase 8 | QuickGen audio/TTS | Pending |
| Phase 9 | Production planning | Pending |