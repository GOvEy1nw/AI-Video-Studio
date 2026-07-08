# projectmem - AI-Video-Studio

_Last updated: 2026-07-08_

## Project purpose
AI Video Studio (AiVS) is a local-first desktop app for AI image, video, and future audio/TTS generation. It is forked from `deepbeepmeep/LTX-Desktop-WanGP` and is being reshaped into a Freepik/Higgsfield-style creative studio powered by WanGP / Wan2GP. The project is community-focused, not commercial.

## Recent issues
- No issues logged yet.

## Decisions
- Multi-shot video generation auto-injects LTX-2.3_Cinematic_hardcut.safetensors at strength 1.0 via WanGP activated_loras/loras_multipliers in video_generation_handler when shotPrompts present; no frontend changes needed.
- Media library plan: GenSpace copies uploads into project assets for generation reuse; video editor keeps in-place references for heavy imports. Shared importMediaAsset helper bridges both paths.

## Notes
- Phase B1 complete: frontend/lib/media-import.ts + electron/lib/project-asset-import.ts + import-to-project-assets IPC (suffix/reuse/overwrite/prompt). copy-to-project-assets uses overwrite. Test: pnpm test:media-import. [frontend/lib/media-import.ts]
- Phase B2 complete: GenSpace gallery accepts OS file drops (empty + populated), importGalleryFile via media-import, source:uploaded assets, all image/video/audio shown in gallery (not generationParams-only). Toast feedback for import success/rejection. [frontend/views/GenSpace.tsx]
- Project assets on disk: uploads/ and generated/ subfolders per project. copy-to-project-assets moves from AppData outputs to generated/; import-to-project-assets copies to uploads/. outputs/ stays as backend staging only. [electron/lib/project-asset-import.ts]
- Phase B3: ensureGalleryAssetForInputFile syncs input file pick/drop to gallery via import + addAsset; gallery drag to input unchanged (no duplicate). Dedup by asset.path. [frontend/lib/media-import.ts]
- Phase B4: DuplicateFilenameDialog on uploads basename collision — Use existing | Add as new copy (suffix) | Cancel. importGalleryFile uses prompt strategy; wired to gallery drop + input attach. [frontend/components/DuplicateFilenameDialog.tsx]
- Phase C1: GalleryFilters popover — type (image/video/audio) + source (generated/uploaded) multi-select; filterGalleryAssets in gallery-filters.ts; combines with Favorites. [frontend/components/GalleryFilters.tsx]
- Phase C2: GenSpace AssetCard shows truncated filename footer on all asset types (getAssetDisplayFileName); audio uses Music icon + hover playback via hidden audio element (audible, loop, reset on leave) instead of waveforms. [frontend/views/GenSpace.tsx]
- GenSpace gallery: filename on grid cards is hover-only overlay (bg-black/60 bar at bottom). Added list view mode (4th option in size menu) with AssetListRow — thumbnail, name, type, source, favorite, delete. [frontend/views/GenSpace.tsx]
- Phase D: GenSpace bins via GalleryBinBar (filter chips, create/rename/delete, drag-to-assign) + GalleryAssetContextMenu on asset right-click. Uses Asset.bin + updateAsset; combines with type/source/favorites filters. [frontend/components/GalleryBinBar.tsx]
- Gallery toolbar: filter icon-only, far left before bins. Phase E mini picker cancelled — bins + filters + drag/drop sufficient. [frontend/components/GalleryFilters.tsx]

## Key files
- `LTX-2.3_Cinematic_hardcut.safetensors`
- `1.0`
- `docs/MEDIA_LIBRARY_PLAN.md`
- `frontend/lib/media-import.ts`
- `electron/lib/project-asset-import.ts`
- `asset.path`
- `gallery-filters.ts`
- `Asset.bin`

## Open questions
- None logged yet.
