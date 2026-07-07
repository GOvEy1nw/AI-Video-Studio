# Phase 0 — Fork Audit & Preservation Map

**Date:** 2026-07-03  
**Status:** Complete  
**Source:** Full codebase audit of `deepbeepmeep/LTX-Desktop-WanGP` fork (≈280 files)

---

## 1. Generation Routes — Complete Flow Map

Each generation path traces the full route: UI trigger → frontend hook → HTTP endpoint → handler → service → output.

### 1.1 Image Generation

| # | Path name | Trigger | Endpoint | Handler method | Service called | External? |
|---|---|---|---|---|---|---|
| A | **WanGP image** | GenSpace.tsx → generateImage() | `POST /api/generate-image` | `image_generation_handler.generate()` → `_generate_via_wangp()` | `WanGPBridge.generate_images()` → `WanGPSession.submit_manifest()` | No |
| B | **ZIT local GPU** | GenSpace.tsx → generateImage() | `POST /api/generate-image` | `image_generation_handler.generate()` → `generate_image()` | `PipelinesHandler.load_zit_to_gpu()` → `ZitImageGenerationPipeline.generate()` | No |
| C | **ZIT via fal.ai API** | GenSpace.tsx → generateImage() (when `force_api_generations` is true) | `POST /api/generate-image` | `image_generation_handler.generate()` → `_generate_via_api()` | `ZitAPIClient.generate_text_to_image()` → `https://fal.ai/dashboard/keys` | **YES — fal.ai cloud** |

**Routing logic (line 49–95 in `image_generation_handler.py`):**
```
if wangp_enabled → path A (WanGP)
else if force_api_generations → path C (fal.ai API)
else → path B (ZIT local GPU)
```

### 1.2 Video Generation

| # | Path name | Trigger | Endpoint | Handler method | Service called | External? |
|---|---|---|---|---|---|---|
| D | **WanGP video** | GenSpace.tsx → generate() | `POST /api/generate` | `video_generation_handler.generate()` → `_generate_via_wangp()` | `WanGPBridge.generate_video()` → `WanGPSession.submit_manifest()` | No |
| E | **LTX local GPU** | GenSpace.tsx → generate() | `POST /api/generate` | `video_generation_handler.generate()` → `generate_video()` | `PipelinesHandler.load_gpu_pipeline("fast")` → `LTXFastVideoPipeline.generate()` | No |
| F | **LTX API video** | GenSpace.tsx → generate() | `POST /api/generate` | `video_generation_handler.generate()` → `_generate_forced_api()` | `LTXAPIClient.generate_text_to_video()` / `generate_image_to_video()` / `generate_audio_to_video()` | **YES — LTX cloud API** |
| G | **A2V local GPU** | GenSpace.tsx → generate() (with audio) | `POST /api/generate` | `video_generation_handler.generate()` → `_generate_a2v()` | `PipelinesHandler.load_a2v_pipeline()` → `LTXa2vPipeline.generate()` | No |

**Routing logic (line 84–163 in `video_generation_handler.py`):**
```
if wangp_enabled → path D (WanGP)
else if should_video_generate_with_ltx_api() → path F (LTX API)
else if audio present → path G (A2V local)
else → path E (LTX fast local GPU)
```

### 1.3 Other Generation Routes

| # | Path name | Trigger | Endpoint | Service | External? |
|---|---|---|---|---|---|
| H | **Retake API** | VideoEditor → RetakePanel | `POST /api/retake` | `LTXAPIClient.generate_retake()` (if forced API) or `LTXRetakePipeline` (local) | **YES (API path)** / No (local path) |
| I | **Retake local GPU** | VideoEditor → RetakePanel | `POST /api/retake` | `LTXRetakePipeline.generate()` | No |
| J | **IC-LoRA** | ICLoraPanel | `POST /api/ic-lora` | `LTXIcLoraPipeline` | No |

### 1.4 Prompt Suggestion (External)

| # | Path name | Trigger | Endpoint | Service | External? |
|---|---|---|---|---|---|
| K | **Gemini gap prompt** | GapGenerationModal | `POST /api/suggest-gap-prompt` | `SuggestGapPromptHandler` → `HTTPClient.post()` → `https://generativelanguage.googleapis.com/...` | **YES — Google Gemini API** |

### 1.5 Text Encoding

| # | Path name | Service | External? |
|---|---|---|---|
| L | **LTX API text encoding** | `LTXTextEncoder.encode_via_api()` → LTX API cloud | **YES — LTX cloud API** |
| M | **Local text encoding** | `LTXTextEncoder` with local Gemma checkpoint | No |

**Routing logic (`TextHandler.should_use_local_encoding()`):**
```
if both LTX API key AND local checkpoint available → use setting `use_local_text_encoder` as tiebreaker
else if only local available → use local
else if only API key available → use API
else → error
```

---

## 2. Cloud/API Dependencies — Complete Inventory

### 2.1 REMOVE — External Services for Normal Generation

| Item | Location(s) | External target | Action |
|---|---|---|---|
| **LTX APIClient** | `backend/services/ltx_api_client/`, `backend/handlers/video_generation_handler.py:_generate_forced_api()`, `backend/handlers/retake_handler.py:_run_api_retake()` | `https://api.ltx.video/` | **REMOVE** — Disable cloud video gen, API retake. Delete the service entirely once WanGP video is stable. |
| **ZIT API Client (fal.ai)** | `backend/services/zit_api_client/`, `backend/handlers/image_generation_handler.py:_generate_via_api()` | `https://fal.ai/` (Z-Image Turbo) | **REMOVE** — Disable cloud image gen. Delete service entirely once WanGP image is stable. |
| **Gemini prompt suggestion** | `backend/handlers/suggest_gap_prompt_handler.py`, `backend/_routes/suggest_gap_prompt.py` | `https://generativelanguage.googleapis.com/` | **REMOVE** — Entire handler + route. Gap prompts can use local logic. |
| **LTX API text encoding** | `backend/services/text_encoder/ltx_text_encoder.py:encode_via_api()` | LTX cloud API | **REMOVE** — Keep only local text encoding path. This is the API path that sends prompts to LTX. |
| **LTX API retake** | `backend/handlers/retake_handler.py:_run_api_retake()` | LTX cloud API | **REMOVE** — Retake should only route through WanGP or local pipeline. |
| **Telemetry** | `electron/analytics.ts` | `https://ltx-desktop.lightricks.com/v2/ingest` | **REMOVE** — Delete the file. Remove all `sendAnalyticsEvent` calls. |
| **ZIT local GPU pipeline** | `backend/services/image_generation_pipeline/zit_image_generation_pipeline.py` | N/A (local GPU, but non-WanGP) | **REMOVE** — Once WanGP image gen is stable, remove non-WanGP image paths. |
| **LTX local GPU video pipeline** | `backend/services/fast_video_pipeline/` | N/A (local GPU, but non-WanGP) | **REMOVE** — Once WanGP video gen is stable, remove non-WanGP video paths. |
| **Retake local GPU pipeline** | `backend/services/retake_pipeline/` | N/A (local GPU) | **REMOVE** — Once WanGP video gen is stable, remove non-WanGP retake paths. |

### 2.2 REMOVE — API Key Management

| Item | Location(s) | Action |
|---|---|---|
| **LTX API key setting** | `AppSettingsContext.tsx` (`hasLtxApiKey`, `userPrefersLtxApiVideoGenerations`, `saveLtxApiKey`), `settings.json` (`ltx_api_key`), `SettingsModal.tsx`, `LtxApiKeyInput.tsx` | **REMOVE** from UI — No API key needed for local-only app |
| **FAL API key setting** | `AppSettingsContext.tsx` (`hasFalApiKey`, `saveFalApiKey`), `settings.json` (`fal_api_key`), `SettingsModal.tsx` | **REMOVE** from UI |
| **Gemini API key setting** | `AppSettingsContext.tsx` (`hasGeminiApiKey`, `saveGeminiApiKey`), `SettingsModal.tsx` | **REMOVE** from UI |
| **API key onboarding flow** | `ApiGatewayModal.tsx`, `FreeApiKeyBubble.tsx`, `FirstRunSetup.tsx` | **REMOVE** — Replace with local-only first-run experience |
| **`force_api_generations` runtime policy** | `runtime_config/runtime_policy.py`, `AppSettingsContext.tsx` (`forceApiGenerations`, `shouldVideoGenerateWithLtxApi`) | **REMOVE** — No concept of "forced API" in a WanGP-only app |
| **FORCED_API constants** | `video_generation_handler.py` (lines 38–49), `api-video-options.ts` | **REMOVE** — Resolution/duration/fps constraints only relevant for API mode |

### 2.3 REMOVE — Branded External Links

| Item | Location(s) | Action |
|---|---|---|
| **`openLtxApiKeyPage` IPC** | `electron/preload.ts:34`, `electron/ipc/app-handlers.ts` | **REMOVE** — Opens external LTX Console link |
| **`openFalApiKeyPage` IPC** | `electron/preload.ts:35`, `electron/ipc/app-handlers.ts` | **REMOVE** — Opens external fal.ai link |

### 2.4 REMOVE — Cloud/API Related Code (Once WanGP Stable)

| Item | Location(s) | Notes |
|---|---|---|
| **LTX API client service** | `backend/services/ltx_api_client/` (protocol + impl) | Delete after WanGP video stable |
| **ZIT API client service** | `backend/services/zit_api_client/` (protocol + impl) | Delete after WanGP image stable |
| **Gemini suggest handler** | `backend/handlers/suggest_gap_prompt_handler.py` | Delete immediately (no WanGP dependency) |
| **Gemini suggest route** | `backend/_routes/suggest_gap_prompt.py` | Delete immediately |
| **Telemetry** | `electron/analytics.ts` | Delete immediately |
| **Docs** | `docs/TELEMETRY.md` | Delete immediately |
| **`force_api_generations` in RuntimeConfig** | `backend/runtime_config/runtime_config.py:25`, `backend/runtime_config/runtime_policy.py` | Remove after UI path gone |
| **`LTXAPIClient` from ServiceBundle** | `backend/app_handler.py` (in `ServiceBundle`, `build_default_service_bundle`) | Remove once no handler references it |
| **`ZitAPIClient` from ServiceBundle** | `backend/app_handler.py` | Remove once no handler references it |
| **Test fakes for removed services** | `backend/tests/fakes/` | Any fake mocks of LTX/ZIT/Gemini |
| **Relevant test files** | `backend/tests/test_ltx_api_client.py`, partial `test_generation.py` | Remove or update |

---

## 3. WanGP Paths — Complete Audit

### 3.1 WanGP Bridge Implementation

**File:** `backend/services/wangp_bridge.py` (590 lines)

**Key capabilities:**
- `WanGPBridge.__init__()` — accepts `enabled`, `root` (Path to Wan2GP checkout), `python_executable`, `config_dir`, `output_dir`, `video_model_type` (default: `ltx2_22B_distilled`), `image_model_type` (default: `z_image`), `camera_motion_prompts`, `extra_args`
- `get_status()` — returns `WanGPBridgeStatus(available, root, python_executable, reason)`. Checks for `wgp.py`, `shared/api.py`, and importability
- `generate_video()` — maps resolution/aspect ratio → WanGP settings dict, builds manifest `[{id: 1, params: {...}, plugin_data: {}}]`, calls `_run_manifest()` with `.mp4/.mov/.mkv/.avi/.webm` suffixes
- `generate_images()` — maps resolution (Qwen-specific resizing), normalizes steps (Z-Image min 8), builds manifest, calls `_run_manifest()` with `.png/.jpg/.jpeg/.webp` suffixes
- `_get_session()` — lazy-initializes `WanGPSession` from `shared.api` module with `config_path`, `output_dir`, `cli_args`
- `_run_manifest()` — submits manifest via `job.submit_manifest()`, processes events in a loop (stream/progress/status/info/error/completed), handles cancel, polls `job.events.get(timeout=0.2)`
- Event handling: tqdm progress parsing (`_parse_tqdm_progress`), phase classification (`_classify_phase`, `_classify_stream_phase`), progress estimation (`_estimate_progress`), console progress logging
- Resolution maps: `_VIDEO_RESOLUTION_MAP` (512p-2160p × 16:9/9:16), `_QWEN_IMAGE_RESOLUTIONS` (5 native sizes)

**VERDICT: KEEP — This is the core generation path for AI Video Studio. Well-architected, self-contained.**

### 3.2 WanGP Configuration

| Setting | Source | Default | Notes |
|---|---|---|---|
| `wangp_enabled` | `RuntimeConfig` (from env/startup) | — | Primary routing gate in handlers |
| `wangp_root` | `WANGP_ROOT` env var or `./Wan2GP` discovery | `None` | Points to Wan2GP checkout |
| `wangp_python` | `WANGP_PYTHON` env var | `None` | Optional custom Python executable |
| `wangp_config_dir` | `RuntimeConfig` | App data dir | Where `wgp_config.json` lives |
| `wangp_video_model_type` | `WANGP_VIDEO_MODEL_TYPE` env var | `ltx2_22B_distilled` | Maps to `model_type` in manifest |
| `wangp_image_model_type` | `WANGP_IMAGE_MODEL_TYPE` env var | `z_image` | Maps to `model_type` in manifest |
| `wangp_extra_args` | `WANGP_EXTRA_ARGS` env var | `()` | Extra CLI args to WanGPSession |

### 3.3 WanGP Detection Flow

```
1. electron/python-backend.ts starts → spawns Python backend
2. backend/ltx2_server.py builds RuntimeConfig
   - Checks for `WANGP_ROOT` env var
   - Checks for `./Wan2GP/` repo-local checkout (preferred)
   - Falls back to `WANGP_ROOT` if no local checkout
3. app_handler.py creates WanGPBridge(enabled=config.wangp_enabled, root=config.wangp_root, ...)
4. health_handler.py `default_warmup()` checks WanGP status and reports startup ready/error
5. Each generation request checks `if self._config.wangp_enabled` as first routing gate
```

### 3.4 What WanGP Bridge Currently Lacks for AI Video Studio MVP

| Gap | Impact |
|---|---|
| No curated model profile layer | All models are just env var strings — no display name, supported features, aspect ratio list, LoRA support flag, install status |
| No LoRA passthrough | Manifest has no `lora` settings field — would need WanGP-side support + bridge passthrough |
| No model availability/install tracking | Bridge only checks if WanGP is importable, not which specific models are installed |
| Hardcoded image model type default (`z_image`) | If we want multiple image models, need a model selection mechanism |
| No reference input support in image gen | `generate_images()` only takes prompt/width/height/steps/seed — no image-to-image or inpainting |
| Qwen-specific resolution mapping is hardcoded | Won't scale well to other models with different native resolutions |

---

## 4. Runtime Setup — Complete Audit

### 4.1 Backend Startup Flow

```
1. Electron main.ts → app.whenReady() → createWindow()
2. renderer (Home.tsx / PythonSetup.tsx) triggers backend start via IPC
3. electron/python-backend.ts → startPythonBackend():
   a. Resolve Python executable (bundled embed or system Python)
   b. Build Python args (ltx2_server.py, --port, --models-dir, --outputs-dir, --wangp-root, etc.)
   c. Spawn process with PYTHONNOUSERSITE=1
   d. Monitor output for port binding / errors
   e. Health-check polling until alive
   f. Publish backend-health-status events to renderer
4. backend/ltx2_server.py:
   a. Build RuntimeConfig from CLI args + env vars
   b. Build AppHandler via build_initial_state()
   c. Create FastAPI app via create_app()
   d. Start uvicorn
5. health_handler.default_warmup() runs
6. Frontend AppSettingsContext receives 'alive' status
7. Frontend fetches settings from /api/settings
8. Frontend fetches runtime policy from /api/runtime-policy
```

### 4.2 Environment Variables Map

| Variable | Used by | Purpose | AI Video Studio fate |
|---|---|---|---|
| `WANGP_ROOT` | `runtime_config.py`, `electron/python-backend.ts` | Path to Wan2GP checkout | **KEEP** |
| `WANGP_PYTHON` | `runtime_config.py` | Custom Python for WanGP | **KEEP** |
| `WANGP_VIDEO_MODEL_TYPE` | `runtime_config.py` | WanGP video model | **EXTEND** — replace with model profile selector |
| `WANGP_IMAGE_MODEL_TYPE` | `runtime_config.py` | WanGP image model | **EXTEND** — replace with model profile selector |
| `WANGP_EXTRA_ARGS` | `runtime_config.py` | Extra WanGP CLI args | **KEEP** |
| `PYTHONNOUSERSITE=1` | `electron/python-backend.ts` | Isolate bundled Python | **KEEP** |
| `LTX_BACKEND_PYTHON` | `electron/python-backend.ts` | Custom Python executable | **KEEP** |
| `BACKEND_DEBUG` | dev mode | Debugpy support | **KEEP** |
| `ELECTRON_DEBUG` | dev mode | Inspector support | **KEEP** |

### 4.3 Model Download / First-Run Flow

**Current:** `FirstRunSetup.tsx` → license acceptance → model download (`HuggingFaceDownloader`) or "download" no-op when WanGP is enabled

**AI Video Studio:** When WanGP is enabled, model management is delegated entirely to WanGP. The first-run should be a lightweight "Welcome to AI Video Studio" screen checking WanGP availability and model status, with no cloud API key prompts.

### 4.4 Data Locations

**Current (inherited):** `%LOCALAPPDATA%/LTXDesktop/` on Windows

**AI Video Studio:** Should change to something like `%LOCALAPPDATA%/AIVideoStudio/` during Phase 1 rebranding. Includes: settings, models, outputs, logs.

---

## 5. Inherited Systems — Keep/Extend/Untouched Map

### 5.1 KEEP (Preserve exactly — critical working systems)

| System | Files | Why |
|---|---|---|
| **Project system** | `frontend/contexts/ProjectContext.tsx`, `frontend/types/project.ts` | Full CRUD for projects, assets, takes, timelines, favorites, view routing. Solid. |
| **Gallery / Asset cards** | `frontend/views/GenSpace.tsx` (AssetCard component, lines 28–1443) | Generation output display, hover preview, favoriting, deletion, drag-to-editor. Well-built. |
| **Generation history / metadata** | `ProjectContext` (asset storage with GenerationParams), `AssetTake` system | Each generation stores prompt, model, resolution, params. Take system supports variations. |
| **Electron shell** | `electron/main.ts`, `electron/window.ts`, `electron/preload.ts`, `electron/app-paths.ts` | App lifecycle, window management, IPC bridge. Solid foundation. |
| **IPC bridge** | `electron/ipc/app-handlers.ts`, `electron/ipc/file-handlers.ts`, `electron/ipc/log-handlers.ts`, `electron/ipc/video-processing-handlers.ts` | File dialogs, log viewing, video processing IPC. All needed. |
| **Export pipeline** | `electron/export/export-handler.ts`, `electron/export/ffmpeg-utils.ts`, `electron/export/timeline.ts`, `electron/export/audio-mix.ts`, `electron/export/video-filter.ts` | FFmpeg-based export. Needed for Production later. |
| **Backend architecture** | `backend/app_handler.py`, `backend/app_factory.py`, `backend/state/`, `backend/handlers/base.py` | Composition root, DI, state machines, locking. Sound architecture. |
| **Backend testing** | `backend/tests/` (all), `backend/tests/fakes/` | Integration-first, mock-free. High-quality. **Preserve the testing discipline.** |
| **Logging system** | `frontend/lib/logger.ts`, `electron/logger.ts`, `electron/logging-management.ts`, `backend/logging_policy.py` | Session logs, backend stdout/stderr routing. Useful for debugging local generation. |
| **WanGP bridge** | `backend/services/wangp_bridge.py` | The core. Keep, extend for model profiles. |
| **Video editor code** | `frontend/views/VideoEditor.tsx` + all 27 `frontend/views/editor/` files | Bonused. Don't touch. Future leverage. |
| **Startup/warmup** | `backend/handlers/health_handler.py:default_warmup()` | WanGP health check on startup. Keep, extend for model status. |

### 5.2 EXTEND (Keep but add to)

| System | Files | Extension needed |
|---|---|---|
| **GenSpace / QuickGen** | `frontend/views/GenSpace.tsx` | Add model profile selector, LoRA controls, keep simple UX per PRD. Already has prompt, resolution, aspect ratio, reference input patterns — reuse them. |
| **WanGP bridge** | `backend/services/wangp_bridge.py` | Add LoRA passthrough, model profile layer, reference input for image gen, model availability checks |
| **Health / status** | `backend/handlers/health_handler.py`, `backend/_routes/health.py` | Add WanGP model availability per model, runtime diagnostics (CUDA, GPU memory), friendly status states |
| **Generation handler** | `backend/handlers/generation_handler.py` | May need to extend for LoRA metadata and seed lock passthrough |
| **Generation hook** | `frontend/hooks/use-generation.ts` | Add LoRA selection params to request body, model profile selection |
| **Settings** | `frontend/contexts/AppSettingsContext.tsx`, `settings.json` | Remove API keys, add model profile preferences, LoRA folder config |
| **Backend types** | `backend/api_types.py` | Add model profile types, LoRA request/response fields |
| **Runtime config** | `backend/runtime_config/runtime_config.py` | Add model profile config, LoRA dirs |
| **Project types** | `frontend/types/project.ts` | Add LoRA info to GenerationParams, WanGP model name to Asset metadata |
| **App handler** | `backend/app_handler.py` | Remove cloud service wiring, add model profile / LoRA handling if needed |
| **IPC preload** | `electron/preload.ts` | Remove API key link openers, potentially add model management IPC |
| **Electron main** | `electron/main.ts` | Remove analytics import, update app title |
| **Build config** | `electron-builder.yml`, `package.json` | Update productName, appId, description |
| **Frontend routing** | `frontend/contexts/ProjectContext.tsx` | May add Production view placeholder, hide/disable editor tab for MVP |

### 5.3 UNTOUCHED (Leave completely alone for MVP)

| System | Files | Reason |
|---|---|---|
| **Video editor** | `frontend/views/VideoEditor.tsx` + all 27 editor files | Bonus. Do not modify. PRD says do not rewrite for MVP. |
| **IC-LoRA** | `frontend/components/ICLoraPanel.tsx`, `backend/handlers/ic_lora_handler.py`, `backend/services/ic_lora_pipeline/` | Editable but not central to MVP image gen. Leave as-is, may become irrelevant once QuickGen LoRA is added. |
| **Backend testing** | `backend/tests/` structure and conventions | Keep the testing discipline. Each removal of cloud services must be accompanied by test updates, but the no-mock, fake-based approach stays. |
| **CI/CD** | `.github/workflows/ci.yml` | Keep typecheck + test pipeline. May update repo references. |
| **Dev setup scripts** | `scripts/setup-dev.ps1`, `scripts/setup-dev.sh` | WanGP setup is correct. May update branding in comments/echo messages. |
| **UI primitives** | `frontend/components/ui/button.tsx`, `select.tsx`, `textarea.tsx`, `tooltip.tsx`, `progress.tsx` | Class-variance-authority components. Fine as-is. |
| **CSP / security** | `electron/csp.ts` | Content security policy. Leave untouched. |
| **TypeScript configs** | `tsconfig.json`, `tsconfig.node.json` | Fine as-is. |
| **Python config** | `backend/pyproject.toml`, `backend/pyrightconfig.json` | Fine as-is. May update project name in pyproject.toml. |
| **GitHub CI** | `.github/workflows/ci.yml` | Keep. May update org/repo references. |
| **Docs (except TELEMETRY.md)** | `docs/CONTRIBUTING.md`, `docs/INSTALLER.md` | Keep. Update branding references in Phase 1. |
| **Resources** | `resources/icon.ico`, `resources/icon.icns`, `resources/installer.nsh`, `resources/entitlements.mac.plist` | May need icon update for rebranding in Phase 1. |
| **Wan2GP checkout** | `.gitignore`d `Wan2GP/` | Managed by setup script. Don't touch. |

### 5.4 REMOVE (Delete or disable - detailed in Section 2)

- Cloud generation services (LTX API, fal.ai/ZIT, Gemini)
- API key management (UI + backend + preload)
- Telemetry (`electron/analytics.ts`)
- Cloud text encoding path
- `docs/TELEMETRY.md`
- `force_api_generations` runtime policy
- FORCED_API constants
- LTX/ZIT branding references (Phase 1)
- First-run API key flow → replace with WanGP welcome flow (Phase 1)

---

## 6. Phase 1 Prerequisites (Next Phase)

Before Phase 1 can begin, this document serves as the source of truth. The Phase 1 implementation should follow this order:

1. **Disable telemetry** — Delete `electron/analytics.ts`, remove all `sendAnalyticsEvent` calls (safe, no dependencies)
2. **Hide cloud API UI** — Remove API key inputs from SettingsModal, hide FreeApiKeyBubble, hide ApiGatewayModal
3. **Remove Gemini suggest** — Delete handler + route + UI trigger (no WanGP dependency)
4. **Disable cloud generation paths** — Make routes unreachable (guard in handlers, remove from UI)
5. **Update branding** — package.json, electron-builder.yml, window title, app data folder name
6. **Update first-run flow** — Replace API key onboarding with WanGP welcome
7. **Verify WanGP-only** — Smoke test that no generation can call external APIs

Remove only after WanGP path is stable:
8. Delete LTX API client service + fakes
9. Delete ZIT API client service + fakes
10. Delete ZIT local pipeline → after WanGP image is stable
11. Delete LTX local pipeline → after WanGP video is stable
12. Delete retake pipeline → after WanGP video is stable