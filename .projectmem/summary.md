# projectmem - AI-Video-Studio

_Last updated: 2026-07-08_

## Project purpose
AI Video Studio (AiVS) is a local-first desktop app for AI image, video, and future audio/TTS generation. It is forked from `deepbeepmeep/LTX-Desktop-WanGP` and is being reshaped into a Freepik/Higgsfield-style creative studio powered by WanGP / Wan2GP. The project is community-focused, not commercial.

## Recent issues
- No issues logged yet.

## Decisions
- Multi-shot video generation auto-injects LTX-2.3_Cinematic_hardcut.safetensors at strength 1.0 via WanGP activated_loras/loras_multipliers in video_generation_handler when shotPrompts present; no frontend changes needed.
- Media library plan: GenSpace copies uploads into project assets for generation reuse; video editor keeps in-place references for heavy imports. Shared importMediaAsset helper bridges both paths.
- Media library plan phases A–D complete in GenSpace (drag inputs, import/dedup, filters, bins, list view). Phase E mini picker cancelled — bins + filter chips + gallery drag/drop cover input picking for v1. [docs/MEDIA_LIBRARY_PLAN.md]
- GenSpace seed control: per-project genSpaceSeedLocked/genSpaceLockedSeed on Project, SeedControl popover (dice/lock icons) beside Enhance, syncs to backend app settings on change and project switch.

## Notes
- GenSpace gallery: filename on grid cards is hover-only overlay (bg-black/60 bar at bottom). Added list view mode (4th option in size menu) with AssetListRow — thumbnail, name, type, source, favorite, delete. [frontend/views/GenSpace.tsx]
- Phase D: GenSpace bins via GalleryBinBar (filter chips, create/rename/delete, drag-to-assign) + GalleryAssetContextMenu on asset right-click. Uses Asset.bin + updateAsset; combines with type/source/favorites filters. [frontend/components/GalleryBinBar.tsx]
- Gallery toolbar: filter icon-only, far left before bins. Phase E mini picker cancelled — bins + filters + drag/drop sufficient. [frontend/components/GalleryFilters.tsx]
- GenSpace gallery toolbar (left→right): filter icon, favorites heart icon, bin chips (scroll); view-size menu alone on right. All toolbar toggles use h-8 fixed height, border always reserved (transparent inactive) to prevent layout shift. [frontend/views/GenSpace.tsx]
- GalleryFilters: icon-only trigger; popover uses bin-style toggle chips (blue=include type/source, grey=exclude). Last chip per group cannot be deselected. Active filter trigger uses blue chip styling. [frontend/components/GalleryFilters.tsx]
- GalleryBinBar: h-8 bin chips (min content width), Folder+ h-8 w-8; All/bin select, drag asset onto chip, right-click rename/delete. Staged bin names until first asset assigned. Pairs with GalleryAssetContextMenu (right-click asset → Move to Bin). [frontend/components/GalleryBinBar.tsx]
- GenSpace AssetCard: hover-only filename overlay (bg-black/60 bottom bar); audio/video hover preview. List view (4th size mode) via AssetListRow — thumbnail, name, type, source, favorite, delete. Lightbox supports audio with controls. [frontend/views/GenSpace.tsx]
- gallery-filters.ts: filterGalleryAssets (type+source), collectGalleryBins, filterGalleryAssetsByBin, getAssetDisplayFileName, inferAssetSource. GenSpace pipeline: type/source filter → bin filter → favorites. [frontend/lib/gallery-filters.ts]
- Media import (B1–B4): importMediaAsset copy-into-project for GenSpace; uploads/ vs generated/ on disk; ensureGalleryAssetForInputFile syncs inputs to gallery; DuplicateFilenameDialog on basename collision. Test: pnpm test:media-import. [frontend/lib/media-import.ts]
- Gallery delete: remove asset from project JSON then waitForMediaFileHandlesReleased before shell.trashItem (Windows file locks). Only paths under {projectId}/ trashed. Do not video.removeAttribute(src) on AssetCard unmount — breaks thumbnails. [frontend/lib/asset-delete.ts]

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

## Open questions
- None logged yet.
