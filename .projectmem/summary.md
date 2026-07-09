# projectmem - AI-Video-Studio

_Last updated: 2026-07-09_

## Project purpose
AI Video Studio (AiVS) is a local-first desktop app for AI image, video, and future audio/TTS generation. It is forked from `deepbeepmeep/LTX-Desktop-WanGP` and is being reshaped into a Freepik/Higgsfield-style creative studio powered by WanGP / Wan2GP. The project is community-focused, not commercial.

## Recent issues
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
