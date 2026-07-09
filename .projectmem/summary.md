# projectmem - AI-Video-Studio

_Last updated: 2026-07-09_

## Project purpose
AI Video Studio (AiVS) is a local-first desktop app for AI image, video, and future audio/TTS generation. It is forked from `deepbeepmeep/LTX-Desktop-WanGP` and is being reshaped into a Freepik/Higgsfield-style creative studio powered by WanGP / Wan2GP. The project is community-focused, not commercial.

## Recent issues
- No issues logged yet.

## Decisions
- Multi-shot video generation auto-injects LTX-2.3_Cinematic_hardcut.safetensors at strength 1.0 via WanGP activated_loras/loras_multipliers in video_generation_handler when shotPrompts present; no frontend changes needed.
- Media library plan: GenSpace copies uploads into project assets for generation reuse; video editor keeps in-place references for heavy imports. Shared importMediaAsset helper bridges both paths.
- Media library plan phases A–D complete in GenSpace (drag inputs, import/dedup, filters, bins, list view). Phase E mini picker cancelled — bins + filter chips + gallery drag/drop cover input picking for v1. [docs/MEDIA_LIBRARY_PLAN.md]
- GenSpace seed control: per-project genSpaceSeedLocked/genSpaceLockedSeed on Project, SeedControl popover (dice/lock icons) beside Enhance, syncs to backend app settings on change and project switch.
- Reframe gen mode: GenSpace UI with OutpaintFrameOverlay + VideoTrimPanel; POST /api/generate with reframe payload; backend maps to WanGP video_guide_outpainting*, video_prompt_type VG|, auto prompt outpaint, ffmpeg clip extract.
- Reframe padding limits: MAX_PADDING_UI=100 for zoom and custom edge expand; MAX_PADDING_INTERNAL=200 for pan redistribution only (e.g. 0/200 when total horizontal is 200). Zoom never introduces >100% per edge; pan is the only path above 100%. [frontend/lib/reframe-outpaint.ts]
- Reframe backend: POST /api/generate accepts reframe (aspectMode, padding 0–200 per edge, trim start/duration); video_generation_handler extracts clip via FFmpeg, maps padding to WanGP video_guide_outpainting* via reframe_wangp_mapping.py, forces video_prompt_type VG| and prompt outpaint; wangp_bridge forwards outpaint fields. [backend/handlers/video_generation_handler.py]
- Reframe overlay UX: aspect-locked modes (1:1/16:9/9:16) use zoom slider (0=fit, 100=aspect-correct max from computeMaxAspectZoomPadding) plus pan; custom mode uses mirrored edge drag (both sides on axis) plus pan; refresh button resets zoom+padding for current mode without switching aspect. [frontend/components/OutpaintFrameOverlay.tsx]

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

## Open questions
- None logged yet.
