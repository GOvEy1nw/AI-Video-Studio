---
id: AIVS-015.01
title: Improve Asset Library selection and selected-generation media inspection
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-17 10:40'
updated_date: '2026-08-17 13:38'
labels:
  - Quick Gen
  - Asset Library
  - Media Viewer
dependencies: []
modified_files:
  - frontend/components/GalleryAssetLibrary.tsx
  - frontend/components/GalleryAssetLibrary.test.tsx
  - frontend/components/GalleryAssetList.tsx
  - frontend/views/genspace/hooks/useGenSpaceGallery.ts
  - frontend/views/editor/AssetContextMenu.tsx
  - frontend/views/editor/AssetContextMenu.test.tsx
  - frontend/views/genspace/GenSpaceSelectedGeneration.tsx
  - frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx
parent_task_id: AIVS-015
priority: medium
type: enhancement
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the existing Quick Gen Asset Library stack and selected-generation viewer so users can build custom asset stacks with direct multi-selection, compare two stacked images, and inspect image/video media more effectively without changing stable asset IDs or existing project compatibility.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ctrl-clicking Asset Library cards enters or updates transient multi-select one asset at a time; Shift-clicking selects the contiguous visible range from the last selected anchor to the clicked asset; a plain asset-card click exits multi-select and normally activates that asset.
- [x] #2 Right-clicking a multi-selected Asset Library card offers Stack Selected and combines the selected compatible assets into one persisted stack while preserving project isolation, stable asset identity, take metadata, and existing unstacked/stacked project compatibility.
- [x] #3 When a stacked image asset is open, the active take is always comparison A; Ctrl-clicking a different take selects or replaces comparison B, and normal take activation exits comparison.
- [x] #4 The selected-generation video player exposes a working Full Screen control using the existing browser media API and retains normal playback behavior.
- [x] #5 Selected-generation images support pointer/wheel zoom and panning within the viewer, plus an accessible Reset Zoom control that restores the usual fitted view without affecting the persisted asset.
- [x] #6 Focused interaction tests protect custom stacking, modifier/range selection, A/B comparison, and selected-generation inspection; TypeScript typecheck, frontend production build, and real Electron interaction smoke are run, with any environment limits reported.
- [x] #7 The A/B comparison control is a visible vertical divider over the image that users drag directly across the media, with equivalent keyboard slider behavior.
- [x] #8 Image wheel zoom, pointer pan, and Reset Zoom work identically while A/B comparison is active.
- [x] #9 Zoom and pan state persist when switching between versions within the same asset stack, but reset when selecting a different asset stack.
- [x] #10 The obsolete multi-selection summary bar with selected count, Clear, and Delete actions is removed; multi-selection actions remain in the right-click context menu.
- [x] #11 Asset cards, list rows, and version tabs do not show the browser-native yellow/white focus outline; deliberate app-coloured selection and keyboard focus feedback remains.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [x] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace the manual Asset Library multi-select toggle with shift-click activation backed by the existing selection state; clear it when clicks leave asset cards and pass the selected IDs into the existing context menu.
2. Rename the existing multi-asset Group as Takes action to Stack Selected and harden it to require same-type assets, flatten existing stacks, preserve per-take metadata, keep the right-clicked asset ID as the stack root, and remove only the absorbed project records (not media files).
3. Extend GenSpaceSelectedGeneration in place: shift-clicked image version tabs select two comparison sources for an accessible A/B reveal slider; image preview gains wheel zoom, pointer pan, and Reset Zoom; the existing video controls gain native requestFullscreen.
4. Extend the three nearest interaction test files for automatic multi-select/clear, stack persistence metadata, A/B comparison, image reset, and video fullscreen. Run focused Vitest, TypeScript typecheck, frontend build, real Electron smoke, complete diff review, and independent reviewer.

Execution refinements: moved click-away clearing to the library root so header and scroll-surface clicks both exit selection; added equivalent grid/list keyboard entry and normal activation; materialized every absorbed legacy take's original-owner fallback metadata while preserving explicit null sentinels; excluded interactive controls from image pan pointer capture after real-Electron Reset Zoom exposed the collision.

Human-review comparison refinement: lift the image transform state to GenSpaceSelectedGeneration and reset it only when Asset.id changes, so normal and A/B image views share one transform across take switches. Reuse one zoom/pan viewport for both modes. Replace the detached native range input with an overlaid keyboard-accessible role=slider divider whose pointer position directly controls the reveal. Extend the existing selected-generation test for divider keyboard/pointer behavior, compare-mode zoom/reset, same-stack persistence, and different-stack reset; rerun focused Vitest, TypeScript, production build, real Electron interaction, and independent review.

Second human-review refinement: keep one local multi-selection anchor in GalleryAssetLibrary. Ctrl/Meta click toggles one asset and updates the anchor; Shift click selects the contiguous range in the actual rendered order (grid display order or list sort order); an unmodified click clears transient selection before normal activation. Remove the bulk summary/Delete strip while retaining right-click Stack Selected. In selected generation, store only the optional B take so the active take is always derived as A; Ctrl/Meta click toggles/replaces B and ordinary tab activation clears comparison. Suppress the browser-native outline on asset cards/list rows/version tabs while retaining blue/violet app selection and focus-visible rings. Update the two focused interaction tests, then run focused Vitest, strict TypeScript, production build, real Electron smoke, diff review, and independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented without a schema, dependency, IPC, or backend change. Gallery selection is transient and supports Shift+click or Shift+Enter/Space, active click/keyboard toggling, and root-level click-away exit. The existing context action is now Stack Selected, same-type guarded, rooted on the right-clicked stable Asset ID, and flattens nested takes after materializing original-owner metadata fallbacks; absorbed records are removed through record-only ProjectContext deletion, never the disk deletion path. Selected generation now provides accessible A/B image comparison, viewer-local wheel zoom/pan/reset, and native video fullscreen. Real Electron found and verified the fix for Reset Zoom pointer capture. A/B runtime inspection was not performed because the available project had no safe stacked-image fixture; focused component coverage verifies its selection, labels, slider, and exit lifecycle.

Human-review refinement complete: the A/B control is now a directly draggable, keyboard-accessible vertical divider. A viewport-fixed divider and reveal mask share one coordinate frame while identical full-size A/B image layers share the same zoom/pan transform. Transform state is parent-owned, persists across take URL changes for one Asset.id, and resets on a different Asset.id.

Real Electron validation on an existing three-take image stack found the first pointer-capture gate prevented mouse dragging. Replaced that gate with explicit divider drag state; after reload, direct drag passed and compare wheel zoom/pan kept the reveal aligned. A later Reset Zoom screenshot was inconclusive after shared desktop focus moved, so the focused component regression explicitly confirms Reset Zoom preserves the A/B slider and tab labels while resetting the transform.

Final verification: `pnpm test:frontend -- frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx` passed 4/4; `pnpm typecheck:ts` passed; `pnpm build:frontend` passed renderer, Electron main, and preload builds with only the existing chunk-size advisory; `git diff --check` passed with only LF-to-CRLF notices. Fresh reviewer verdict: ship.

Second Human Review refinement complete: GalleryAssetLibrary now follows desktop selection semantics. Ctrl/Meta seeds from the existing active selection and toggles one asset; Shift selects the anchored contiguous range in the actual grid or sorted-list order; plain activation clears transient multi-select before selecting the clicked asset. Filter changes clear stale anchors. Modifier-aware keyboard activation dispatches real mouse clicks. The obsolete selected-count/Clear/Delete strip is removed; same-type right-click still exposes Stack Selected.

Selected-generation comparison now derives A from the active take and stores only optional B. Ctrl/Meta click selects, replaces, or toggles B; Shift/plain activation selects a take normally and exits comparison; external active-take changes also clear B. Asset cards, list rows, and take tabs suppress the browser-native outline and retain blue/violet app focus/selection feedback.

Final verification: `pnpm test:frontend -- frontend/components/GalleryAssetLibrary.test.tsx frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx` passed 2 files, 15/15 tests; `pnpm typecheck:ts` passed; `pnpm build:frontend` passed renderer, Electron main, and preload with only the existing chunk-size advisory; `git diff --check` passed with Windows line-ending notices only. Real Electron passed grid Ctrl/Shift/plain selection, no bulk strip, sorted list range selection, same-type Stack Selected menu presence, active-A/Ctrl-B replacement/toggle, Shift take activation, and no native yellow/white outline on exercised cards/rows/tabs. Fresh reviewer verdict: ship.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: user
created: 2026-08-17 12:25
---
Human review requested the A/B range control become a directly draggable vertical divider, comparison mode share image zoom/pan/reset, and the viewer transform persist across version switches within one stack.
---

author: user
created: 2026-08-17 13:12
---
Human review requested desktop-style Asset Library modifiers (Ctrl toggle, Shift anchored range, plain click exits), removal of the obsolete multi-selection action strip, active-take-as-A Ctrl-click comparison selection, and removal of the browser-native yellow/white outline while retaining intentional app focus/selection feedback.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

- Asset Library selection now follows desktop conventions: Ctrl/Command toggles individual assets, Shift selects an anchored contiguous range in grid or sorted-list order, and a plain card activation exits transient multi-select and selects normally.
- Removed the obsolete selected-count/Clear/Delete strip; `Stack Selected` remains in the same-type right-click context menu.
- Stacked-image comparison now always uses the active take as A; Ctrl/Command-click selects, replaces, or toggles B, while Shift/plain activation changes the active take and exits comparison.
- Removed the browser-native yellow/white outline from affected asset cards, list rows, and take tabs while retaining deliberate blue/violet keyboard focus and selection feedback.
- Existing direct A/B divider, compare zoom/pan/reset, same-stack transform persistence, custom stacking, and video fullscreen remain intact.

## Verification

- Focused Vitest: Gallery Asset Library + selected generation — 2 files, 15/15 tests passed.
- `pnpm typecheck:ts` — passed.
- `pnpm build:frontend` — renderer, Electron main, and preload passed; only the existing chunk-size advisory remained.
- Real Electron — grid Ctrl/Shift/plain selection, no bulk bar, sorted-list range, same-type `Stack Selected` menu, active-A/Ctrl-B replace/toggle, Shift take activation, and app-coloured/no-native-outline states passed.
- Independent review verdict: ship. `git diff --check` clean apart from Windows line-ending notices.

## Scope

No dependency, persistence schema, IPC, backend, or media-file deletion changes were introduced.
<!-- SECTION:FINAL_SUMMARY:END -->
