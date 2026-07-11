# projectmem - AI-Video-Studio

_Last updated: 2026-07-11_

## Project purpose
AI Video Studio (AiVS) is a local-first desktop app for AI image, video, and future audio/TTS generation. It is forked from `deepbeepmeep/LTX-Desktop-WanGP` and is being reshaped into a Freepik/Higgsfield-style creative studio powered by WanGP / Wan2GP. The project is community-focused, not commercial.

## Recent issues
- [OPEN] #0038 Retake is not currently compatible with WanGP despite visible UI routing; it must be disabled and documented as coming soon. [frontend/views/GenSpace.tsx] (open)
  - Failed attempt: Combined Retake UI patch did not apply because AssetCard props use a different destructuring context; no files changed. [frontend/views/GenSpace.tsx]
  - Failed attempt: Release installer build command exceeded the shell timeout before reporting completion; inspecting its temporary output before retrying. [electron-builder.yml]
- [OPEN] #0037 Model-pack progress UI remains at 0 then 100 because WanGP/Hugging Face transfer output is not captured as progress; first-run needs project storage selection with Documents\\AiVS default. [electron/python-setup.ts; frontend/components/ModelPackManager.tsx; frontend/components/PythonSetup.tsx] (open)
  - Failed attempt: Installer file appeared before NSIS finished writing; initial copied retest was only 361 KB. Waiting for final archive size before replacing it. [electron-builder.yml]
- [OPEN] #0036 Model-pack download IPC exits with code 2 from both first-run and Settings; pack runner argument forwarding must be corrected and pack cards should show approximate download sizes. [electron/python-setup.ts; backend/wangp_model_packs.py; frontend/components/ModelPackManager.tsx] (open)
  - Failed attempt: CLI isolation removed argparse exit 2, but smoke import then failed because WanGP resolves models/_settings.json relative to its checkout. Runner must use Wan2GP as its working directory. [backend/wangp_model_packs.py]
- [OPEN] #0035 First-run setup exposes pynvml FutureWarning and raw dependency output; model assets should be optional WanGP-managed packs with live progress and cancellation, plus settings management. [electron/python-setup.ts; frontend/components/PythonSetup.tsx] (open)
  - Failed attempt: Final unpacked build retry still hit electron-builder EPERM renaming win-unpacked.tmp, despite escalation. Code and test checks remain green; retry once before treating it as environment contention. [electron-builder.yml]
  - Partial attempt: All code checks passed (TypeScript, Pyright, 150 pytest, PowerShell parser, Vite, model-pack runner list). Electron Builder remains blocked before resource copy by Windows EPERM rename; staged package cannot verify files until that external file lock clears. [electron-builder.yml]
  - Failed attempt: Electron Builder reached NSIS build/signing output but no AiVS-Setup.exe was present afterward. Inspecting temporary output before retrying. [electron-builder.yml]
- [OPEN] #0034 Fresh install reports dependency setup near 50% without detailed transfer progress, then first generation downloads WanGP utility models despite ready status; bootstrap should expose useful progress and trigger first WanGP preparation before the first generation. [scripts/install-python-dependencies.ps1; electron/python-setup.ts; backend/handlers/health_handler.py] (open)
  - Failed attempt: Added streamed setup detail and default WanGP asset pre-download code. TypeScript and focused WanGP bridge tests pass; initial PowerShell parser command was malformed and did not validate the installer script.
  - Partial attempt: Implemented streamed installer stdout/stderr detail with heartbeat, switched setup subprocess to streaming spawn, and added best-effort default WanGP shared-asset/model pre-download. Verified 151 pytest tests, Pyright, TypeScript, PowerShell parser, Vite build, and fresh unpacked/NSIS package resources; clean-machine UX retest remains.
- [DONE] #0033 First-run UI and /api/models/download still invoke legacy standalone LTX/Z-Image model downloader instead of WanGP model acquisition. [backend/_routes/models.py] -> Removed FirstRun model installation calls and /api/models routes, downloader handlers, direct pipeline services, IC-LoRA panel, stale downloader hook, and LTX/Fal key-page IPC. WanGP remains sole model acquisition and generation owner. Verified with Pyright, 150 pytest tests, TypeScript, and grep for stale runtime endpoints. (fixed)
  - Failed attempt: Removed legacy standalone downloader routes, services, and hidden IC-LoRA panel. Residual IC-LoRA API DTO patch did not match current file, so no DTO changes applied in that attempt.
- [DONE] #0032 prepare-python.ps1 leaves generated backend/requirements-dist.txt after filtering GPU Torch requirements for the embedded runtime. [scripts/prepare-python.ps1] -> prepare-python cleanup now removes both generated requirements files; compact bootstrap uses bundled uv and copies matching Python headers/import libraries for native WanGP kernels. [scripts/prepare-python.ps1] (fixed)
  - Partial attempt: Adjusted GPU stack installer to accept bundled uv and a packaged Wan2GP source directory; bootstrap scripts can now reuse it without global tools or Git. [scripts/install-wangp-stack.ps1]
- [OPEN] #0031 Final AiVS-Setup.exe is not Authenticode-signed; release build needs a valid Windows code-signing certificate/configuration. [electron-builder.yml] (open)
  - Partial attempt: Updated audit runtime strategy and definition of done to document compact bundled Python+pip+uv bootstrap; code-signing remains externally unresolved. [docs/AiVS_Pre-Release_Code_Audit_and_Cleanup_Plan.md]
  - Failed attempt: Built and verified fresh NSIS installer release/verify-installer-network/AiVS-Setup.exe (305,862,379 bytes), then promoted it to release/. Authenticode remains NotSigned because no code-signing certificate/configuration is available.
  - Failed attempt: Updated v0.1 audit definition of done with fresh NSIS package-resource validation. Clean user-profile first-run and Authenticode signing remain unchecked.
- [DONE] #0030 NSIS cannot mmap the 3.39 GB app archive because python-embed is accidentally included in packaged app despite verified runtime-download design. [electron-builder.yml] -> Wan2GP user-local LoRA weights and codegraph cache are excluded from the installer; resulting NSIS build succeeds. [electron-builder.yml] (fixed)
  - Partial attempt: Excluded user-local Wan2GP LoRA weights and codegraph cache from extraResources; bundled FFmpeg remains for backend media operations. [electron-builder.yml]
- [DONE] #0029 NSIS installer build fails because custom installer script requires resources/vc_redist.x64.exe but the file is absent. [resources] -> VC++ redistributable is provisioned, signature-checked at build time, packaged as an Electron resource, and the final NSIS installer builds successfully. [scripts/create-installer.ps1] (fixed)
  - Partial attempt: Added VC++ redistributable download plus Authenticode/Microsoft signer verification before NSIS build, and switched installer script to local electron-builder. [scripts/create-installer.ps1]
  - Failed attempt: Full NSIS build no longer misses VC++ payload but fails with NSIS internal mmap error while embedding its 25.7 MB executable through custom File macro. [resources/installer.nsh]
  - Partial attempt: Moved VC++ redistributable into electron-builder extraResources and execute it from installed resources, removing NSIS custom File embedding. [electron-builder.yml]
- [DONE] #0028 Backend pytest exits with status 1 but emits no diagnostics when invoked through uv; test failure cause needs capture. [backend/tests] -> Removed deleted cloud/direct-pipeline test dependencies and aligned remaining state tests to WanGP terminal behavior; 186 backend tests pass. [backend/tests] (fixed)
  - Partial attempt: Removed stale cloud-credential and direct-pipeline expectations; generation state tests now cover WanGP jobs and settings tests no longer assert removed text cache. [backend/tests/test_state_actions.py]
  - Failed attempt: WanGP job completion keeps generation progress at complete, so the migrated test's idle expectation was incorrect. [backend/tests/test_state_actions.py]
  - Partial attempt: Changed migrated generation progress test to assert the actual complete terminal state; final backend test rerun pending. [backend/tests/test_state_actions.py]
- [DONE] #0027 Pyright fails: ImageGenerationHandler references Path without import, causing unknown types; VideoGenerationHandler has unused duration helper. [backend/handlers/image_generation_handler.py] -> Image input paths are typed via pathlib.Path and unused direct-API duration code removed; pyright reports 0 errors. [backend/handlers/image_generation_handler.py] (fixed)
  - Partial attempt: Imported pathlib.Path for image input validation and removed orphaned direct-API duration constants/helper; Pyright recheck pending. [backend/handlers/image_generation_handler.py]
- [DONE] #0026 TypeScript build fails: persistence IPC methods are absent from Electron API renderer typing; GenSpace has unused formatAutoDuration import. [frontend/contexts/ProjectContext.tsx] -> Renderer persistence IPC methods are typed and unused GenSpace formatter removed; local tsc --noEmit passes. [frontend/vite-env.d.ts] (fixed)
  - Partial attempt: Added persistence IPC methods to renderer Window typing and removed unused GenSpace duration formatter; TypeScript recheck pending. [frontend/vite-env.d.ts]
- [DONE] #0025 Runtime asset splitter fails for archives larger than 2 GB because Math.Min coerces remaining bytes to Int32. [scripts/create-python-runtime-assets.ps1] -> Runtime asset splitter supports >2 GB archives and writes BOM-free JSON under Windows PowerShell 5.1 and 7. [scripts/create-python-runtime-assets.ps1] (fixed)
  - Partial attempt: Changed splitter calculations to Int64 while casting individual buffer reads back to Int32; rerun pending. [scripts/create-python-runtime-assets.ps1]
  - Failed attempt: Int64 splitter passed, but archive manifest write failed under Windows PowerShell 5.1 because utf8NoBOM encoding is unsupported. [scripts/create-python-runtime-assets.ps1]
  - Partial attempt: Replaced PowerShell-version-specific manifest encoding with .NET UTF8Encoding without BOM; rerun pending. [scripts/create-python-runtime-assets.ps1]
- [DONE] #0024 Clean runtime preparation cannot start: pnpm refuses the locked 10.30.3 binary because registry signature fetch verification fails. [package.json] -> Replaced separate prebuilt runtime archive with bundled Python+pip+uv bootstrap; final compact installer builds and first-run installs pinned GPU dependencies automatically. [electron/python-setup.ts] (fixed)
  - Partial attempt: Elevated local Vite build completed: frontend, Electron main, and preload bundles built successfully. [vite.config.ts]
  - Failed attempt: Unpacked Windows package reached Electron but failed when electron-builder downloaded a Windows helper: sandbox network EACCES. [electron-builder.yml]
  - Partial attempt: Elevated electron-builder --win --dir succeeded and created release/win-unpacked. [electron-builder.yml]
- [DONE] #0023 ProjectContext synchronously saved entire project library and repeatedly approved every stored path after each change. [frontend/contexts/ProjectContext.tsx] -> Project persistence now uses debounced per-project atomic Electron files with localStorage migration and cached approvals. [frontend/contexts/ProjectContext.tsx] (fixed)
- [DONE] #0022 Hidden IC-LoRA route still instantiated direct LTX pipelines, keeping legacy runtime graph reachable. [backend/_routes/ic_lora.py] -> Hidden IC-LoRA direct route and pipeline composition removed; no reachable direct pipeline is instantiated. [backend/app_handler.py] (fixed)
- [DONE] #0021 Cloud API credentials and dead LTX/fal generation clients remained in release settings and runtime wiring. [backend/state/app_settings.py] -> Cloud API credentials and LTX/fal clients removed; saved settings purge legacy secret keys. [backend/state/app_settings.py] (fixed)
- [DONE] #0020 Image handler retained unreachable fal.ai generation fallback despite WanGP-only enforcement. [backend/handlers/image_generation_handler.py] -> Unreachable fal.ai image generation fallback and its app wiring were removed. [backend/handlers/image_generation_handler.py] (fixed)
- [DONE] #0019 Runtime could choose an API-only fallback despite the WanGP-only local product boundary. [backend/runtime_config/runtime_policy.py] -> Forced cloud API runtime policy and its routes were removed; generation requires WanGP. [backend/runtime_config/runtime_policy.py] (fixed)
- [DONE] #0018 WanGP preview events synchronously rewrote JPEG output for every event, causing unnecessary disk encoding during generation. [backend/services/wangp_bridge.py] -> WanGP preview image writes are throttled to two per second. [backend/services/wangp_bridge.py] (fixed)
- [DONE] #0017 Image variations were submitted as one WanGP GPU batch, risking avoidable VRAM OOM on heavy profiles. [backend/handlers/image_generation_handler.py] -> Image variations are profile-bounded and submitted to WanGP in conservative sequential chunks. [backend/handlers/image_generation_handler.py] (fixed)
- [DONE] #0016 AiVS globally monkey-patched torch SDPA to SageAttention, overriding WanGP model-specific attention selection. [backend/ltx2_server.py] -> AiVS no longer monkey-patches torch attention; WanGP selects its own attention implementation. [backend/ltx2_server.py] (fixed)
- [DONE] #0015 Packaged Python download still targets Lightricks assets and extracts unverified runtime parts; release GPU setup diverges from tested WanGP stack. [electron/python-setup.ts; scripts/prepare-python.ps1] -> Removed packaged Lightricks runtime download path; bundled Python+pip+uv now installs the pinned WanGP stack on first run. [electron/python-setup.ts] (fixed)
  - Failed attempt: Initial deterministic-runtime patch did not apply because its source-context regex did not exactly match electron/python-setup.ts; no files changed.
  - Partial attempt: Deterministic-runtime patch passes TypeScript typecheck and PowerShell parser validation; Bash syntax check could not run because this Windows host has no WSL distribution.
- [DONE] #0014 IC-LoRA remains a reachable direct pipeline route, contradicting the WanGP-only product boundary. [backend/_routes/ic_lora.py; backend/handlers/ic_lora_handler.py] -> Hidden unsupported IC-LoRA route and direct pipeline handler removed from AiVS v0.1. [backend/_routes/ic_lora.py] (fixed)
- [DONE] #0013 Visible Retake control posts to /api/retake, whose WanGP-only handler returns 503; inherited direct Retake path remains. [frontend/hooks/use-retake.ts; backend/handlers/retake_handler.py] -> Retake remains visible and now translates to a trimmed WanGP control-video generation request. [backend/handlers/retake_handler.py] (fixed)
  - Partial attempt: Removed all GenSpace Retake controls, state, request path, and result handling; TypeScript check passes. Legacy editor and Playground Retake controls remain. [frontend/views/GenSpace.tsx]
  - Partial attempt: Removed remaining visible Retake controls and editor handoff; TypeScript check passes. Retake backend and unused frontend files remain for deletion. [frontend/views/Playground.tsx; frontend/views/VideoEditor.tsx; frontend/views/editor/ClipContextMenu.tsx]
- [OPEN] #0012 projectmem precheck_file rejected documented `path` argument; MCP schema requires `file_path`. [docs/AiVS_Pre-Release_Code_Audit_and_Cleanup_Plan.md] (open)
- [DONE] #0011 Guide remove still needs second click while trim editor is open despite pointer/mouse remove handler [frontend/views/GenSpace.tsx] -> Late trim editor updates no longer re-add removed guide video, so first remove click persists while trim UI is open [frontend/views/GenSpace.tsx] (fixed)
- [DONE] #0010 Remove still takes two clicks when normal guide trim UI is open [frontend/views/GenSpace.tsx] -> Remove now clears guide trim/menu state and removes the guide media through a functional update on first activation [frontend/views/GenSpace.tsx] (fixed)
- [DONE] #0009 Remove action still only closes trim editor, and media inputs collapse on mode changes [frontend/views/GenSpace.tsx] -> Remove now deletes guide media during first pointer activation, and media input expansion persists across mode/profile changes [frontend/views/GenSpace.tsx] (fixed)
- [DONE] #0008 Normal guide video remove closes trim editor first, and video input leaks into image mode [frontend/views/GenSpace.tsx] -> Remove now completes on first click, and switching to image mode drops video/audio guide inputs [frontend/views/GenSpace.tsx] (fixed)
- [DONE] #0007 Guide trim regressed: duration remains zero so timeline hides, and preview still appears left aligned [frontend/views/GenSpace.tsx; frontend/components/VideoTrimPanel.tsx] -> Fixed guide trim duration regression and centered video frame sizing [frontend/views/GenSpace.tsx] (fixed)
  - Failed attempt: Combined duration and centering patch did not apply because current class text differed; no files changed [frontend/views/GenSpace.tsx]
- [DONE] #0006 Normal guide trim layout needs centered preview, trim before media slots, and outside-click closure for media role menus [frontend/views/GenSpace.tsx] -> Confirmed trim preview/layout and media role menu interaction refinements [frontend/views/GenSpace.tsx] (fixed)
- [DONE] #0005 Normal guide trim duration path should mirror Retake/Reframe local videoRef state instead of parent mediaDuration synchronization [frontend/views/GenSpace.tsx] -> Normal guide trim now mirrors Retake/Reframe duration ownership and loadedmetadata handling exactly [frontend/views/GenSpace.tsx] (fixed)
- [DONE] #0004 Visible normal-guide preview renders but media duration stays zero, hiding trim filmstrip and leaving time display 00:00 [frontend/views/GenSpace.tsx; frontend/components/VideoTrimPanel.tsx] -> Fixed zero-duration guide trim by probing media immediately and on all duration readiness events, allowing VideoTrimPanel to render filmstrip and range [frontend/views/GenSpace.tsx] (fixed)
- [DONE] #0003 Normal video-guide trim renders empty header because metadata is unavailable; UI needs Retake-style preview and filmstrip [frontend/views/GenSpace.tsx; frontend/components/VideoTrimPanel.tsx] -> Confirmed normal guide trim renders visible media preview, playback controls, five-second default range, and shared Retake-style filmstrip before Confirm [frontend/views/GenSpace.tsx] (fixed)
  - Failed attempt: First visible trim UI compile exposed missing Play/Pause imports after adding Retake-style playback controls [frontend/views/GenSpace.tsx]
  - Failed attempt: Visual Vite launch failed in sandbox because esbuild could not read parent directory/config; static TypeScript check remained clean [frontend/views/GenSpace.tsx]
- [DONE] #0002 Regression: reframe zoom disabled for every aspect, normal video-guide trim and auto duration fail, previews stop updating [frontend/components/ReframePanel.tsx; frontend/views/GenSpace.tsx; frontend/hooks/use-generation.ts] -> Confirmed fixes: fit-based reframe zoom guard, committed normal guide trim with Trim action and auto duration, cache-busted WanGP preview updates [frontend/components/ReframePanel.tsx; frontend/views/GenSpace.tsx; backend/services/wangp_bridge.py] (fixed)
  - Failed attempt: Initial TypeScript check command was quoted for nested PowerShell and never invoked tsc; backend focused tests passed [frontend/components/ReframePanel.tsx]
  - Failed attempt: Second TypeScript check hit bundled pnpm dependency-layout repair and offline registry failure before compiling [frontend/components/ReframePanel.tsx]
- [DONE] #0001 Sliding-window WanGP video generation persists first/intermediate output instead of final combined output in gallery [backend/services/wangp_bridge.py] -> WanGP sliding-window gallery output now uses final/newest generated media path; verified by test_select_final_output_prefers_newest_combined_file plus full backend pytest. [backend/services/wangp_bridge.py] (fixed)

## Decisions
- Multi-shot video generation auto-injects LTX-2.3_Cinematic_hardcut.safetensors at strength 1.0 via WanGP activated_loras/loras_multipliers in video_generation_handler when shotPrompts present; no frontend changes needed.
- Media library plan: GenSpace copies uploads into project assets for generation reuse; video editor keeps in-place references for heavy imports. Shared importMediaAsset helper bridges both paths.
- Media library plan phases A–D complete in GenSpace (drag inputs, import/dedup, filters, bins, list view). Phase E mini picker cancelled — bins + filter chips + gallery drag/drop cover input picking for v1. [docs/MEDIA_LIBRARY_PLAN.md]
- GenSpace seed control: per-project genSpaceSeedLocked/genSpaceLockedSeed on Project, SeedControl popover (dice/lock icons) beside Enhance, syncs to backend app settings on change and project switch.
- Reframe padding limits: MAX_PADDING_UI=100 for zoom and custom edge expand; MAX_PADDING_INTERNAL=200 for pan redistribution only (e.g. 0/200 when total horizontal is 200). Zoom never introduces >100% per edge; pan is the only path above 100%. [frontend/lib/reframe-outpaint.ts]
- Reframe overlay UX: aspect-locked modes (1:1/16:9/9:16) use zoom slider (0=fit, 100=aspect-correct max from computeMaxAspectZoomPadding) plus pan; custom mode uses mirrored edge drag (both sides on axis) plus pan; refresh button resets zoom+padding for current mode without switching aspect. [frontend/components/OutpaintFrameOverlay.tsx]
- Reframe mode uses WanGP video_prompt_type `VG` (not `VG|`), `audio_prompt_type=K`, optional user prompt with blank fallback `outpaint`, and reframe-only defaults `force_fps=auto` plus `sliding_window_overlap=33`. [backend/handlers/video_generation_handler.py]
- Input-video WanGP generations may pass source `video_length_frames`; bridge normalizes this to WanGP `8n+1` video_length so reframe/control-video output length follows source clip frames instead of request FPS. [backend/services/wangp_bridge.py]
- Supersedes earlier Reframe `VG|` decision: Reframe now lives under Video process mode, renders inside the prompt bar with optional prompt field, and sends `VG` plus blank-prompt fallback `outpaint`. [frontend/views/GenSpace.tsx]
- Supersedes earlier Reframe backend `VG|` decision: backend uses `video_prompt_type=VG`, `audio_prompt_type=K`, explicit padding outpaint fields, `force_fps=auto`, `sliding_window_overlap=33`, and source-frame video_length where available. [backend/handlers/video_generation_handler.py]
- WanGP Outputs settings are persisted under AppSettings.output_settings and mapped into WanGP server_config/default manifest keys: video/audio/image codec, container, metadata mode, and sliding-window retention. [backend/state/app_settings.py]
- v0.1 Retake remains visible and is implemented as a WanGP normal-video request using a trimmed control-video guide; inherited LTX API/direct Retake execution is no longer used.
- AiVS environment variables are canonical (AIVS_APP_DATA_DIR, AIVS_AUTH_TOKEN, AIVS_PORT, AIVS_BACKEND_PYTHON); LTX equivalents are read-only fallbacks for one compatibility period.
- AiVS v0.1 stores no cloud API credentials; all generation routes use WanGP only. [backend]
- User confirms Phases 6 (QuickGen image polish) and 7 (QuickGen video) are complete; project map phase table is stale. [AGENTS_PRD.md]
- v0.1 will bundle embedded Python with pip/uv and install the pinned WanGP GPU runtime automatically on first run; it will not publish a separate prebuilt python-embed archive. [electron/python-setup.ts]
- AiVS v0.1 removes its standalone model downloader and first-run model installer; WanGP remains sole owner of model acquisition, while AiVS exposes only generation/readiness status. [backend/_routes/models.py]
- First-run setup will pre-download WanGP shared utility assets and AiVS's default image model after Python/GPU dependencies install, without generating media or loading models on the GPU. The preparation is best-effort so unsupported/offline systems can still launch and retry on first generation.
- Model downloads are optional WanGP-defined packs: first-run setup installs only runtime dependencies; the renderer controls an Electron-owned Python child downloader for live sanitized progress and cancellation, reused by Settings Model Manager. [electron/python-setup.ts; frontend/components/PythonSetup.tsx]
- First-run order is runtime setup, optional model packs, then project storage confirmation. New projects default to Documents\\AiVS; runtime and updater remain per-user app data because they are executable/cache/update state, not user project content. [frontend/components/PythonSetup.tsx; electron/app-state.ts]

## Notes
- gallery-filters.ts: filterGalleryAssets (type+source), collectGalleryBins, filterGalleryAssetsByBin, getAssetDisplayFileName, inferAssetSource. GenSpace pipeline: type/source filter → bin filter → favorites. [frontend/lib/gallery-filters.ts]
- Media import (B1–B4): importMediaAsset copy-into-project for GenSpace; uploads/ vs generated/ on disk; ensureGalleryAssetForInputFile syncs inputs to gallery; DuplicateFilenameDialog on basename collision. Test: pnpm test:media-import. [frontend/lib/media-import.ts]
- Gallery delete: remove asset from project JSON then waitForMediaFileHandlesReleased before shell.trashItem (Windows file locks). Only paths under {projectId}/ trashed. Do not video.removeAttribute(src) on AssetCard unmount — breaks thumbnails. [frontend/lib/asset-delete.ts]
- GenSpace gallery Apply prompt (ClipboardPaste icon): restores generationParams to prompt bar — mode, prompt, settings, image/audio inputs. Grid hover next to Create video/Retake; list view action column. Helper: frontend/lib/apply-generation-params.ts.
- Apply prompt input media fix: deferred restore after PromptBar profile normalization; buildImageInputsFromParams merges inputAudioUrl; expand media strip; add control_video/audio_guide to video input roles.
- Legacy apply-prompt media: generationParams now stores input paths; recoverGenerationParamsMedia on project load resolves stale blob URLs via project asset paths; buildImageInputsFromParams resolves against gallery assets at apply time.
- gotcha: ReframePadding per-edge le must be 200 not 100 — pan values >100 caused Pydantic to reject entire reframe payload so WanGP never received video_guide_outpainting fields despite prompt outpaint + VG| being sent. Frontend normalizeReframeForApi in use-generation.ts clamps 0–200. [backend/api_types.py]
- Reframe math module: computeFitPadding, computeMaxAspectZoomPadding, paddingForAspectZoom (lerp fit→max preserving aspect), applyPanPadding (pixel gaps, preserves totals), applyZoomPreservingPan, applyMirroredEdgeExpand (custom), computeFrameLayout (two-phase hug-then-shrink). Used by OutpaintFrameOverlay + ReframePanel. [frontend/lib/reframe-outpaint.ts]
- GenSpace reframe mode: ReframePanel (trim + overlay), reframeInput state, generate with reframe body; gallery Apply prompt restores aspectMode/padding via apply-generation-params.ts; asset metadata stores reframe fields on generationParams. [frontend/views/GenSpace.tsx]
- Reframe tests: test_reframe_wangp_mapping.py (padding→WanGP outpaint mapping), test_generation.py reframe branches (internal padding up to 200, requires options payload). Run: cd backend && uv run pytest tests/test_reframe_wangp_mapping.py tests/test_generation.py -v --tb=short [backend/tests/test_reframe_wangp_mapping.py]

## Key files
- `LTX-2.3_Cinematic_hardcut.safetensors`
- `1.0`
- `docs/MEDIA_LIBRARY_PLAN.md`
- `frontend/lib/media-import.ts`
- `electron/lib/project-asset-import.ts`
- `asset.path`
- `gallery-filters.ts`
- `Asset.bin`
- `shell.trashItem`
- `video.removeAttribute`
- `frontend/lib/apply-generation-params.ts`
- `e.g`
- `reframe_wangp_mapping.py`
- `use-generation.ts`
- `apply-generation-params.ts`
- `test_reframe_wangp_mapping.py`
- `test_generation.py`
- `tests/test_reframe_wangp_mapping.py`
- `tests/test_generation.py`
- `AppSettings.output`

## Open questions
- None logged yet.
