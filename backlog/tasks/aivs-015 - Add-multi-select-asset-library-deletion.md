---
id: AIVS-015
title: Add multi-select asset library deletion
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-03 15:32'
updated_date: '2026-08-03 16:01'
labels:
  - frontend asset-library
dependencies: []
modified_files:
  - frontend/components/GalleryAssetLibrary.tsx
  - frontend/components/GalleryAssetList.tsx
  - frontend/components/GalleryAssetLibrary.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceGallery.ts
  - frontend/views/genspace/hooks/useGenSpaceGallery.test.tsx
  - frontend/views/director/DirectorSidebar.tsx
  - frontend/views/editor/LeftPanel.tsx
priority: medium
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let users enter a dedicated multi-select mode in the shared Asset Library, then select multiple asset cards by clicking or dragging a selection box so bulk deletion is practical and clearly scoped.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Asset Library exposes an accessible multi-select mode toggle and clear active-mode state.
- [x] #2 While multi-select mode is active, users can click cards to toggle selection and drag a marquee box across cards to select multiple assets.
- [x] #3 Selected cards have a clear visual and accessible selected state, and selection can be cleared without deleting assets.
- [x] #4 Bulk delete acts on the selected assets through existing project-scoped deletion behavior and exits or clears selection safely.
- [x] #5 Focused tests cover mode toggling, click selection, marquee selection, selection clearing, and bulk-delete wiring.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [ ] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reproduce direct card-click and native text-selection regressions with pointer-event coverage. 2. Keep pointer capture out of the ordinary click path; start marquee capture only after movement threshold and suppress native selection while dragging. 3. Run focused tests, TypeScript/build checks, record evidence, and return task to Human Review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented shared multi-select toolbar, local click/keyboard selection, marquee selection, accessible checkbox state, and clear/delete controls. Wired onDeleteAssets through GenSpace, Director, and Video Editor callers to existing useAssetDeletion. Added GalleryAssetLibrary and useGenSpaceGallery focused coverage.

Validation: direct cached Vitest targeted run passed 3/3 changed-behavior tests (click/keyboard/clear/bulk delete, marquee, GenSpace deletion routing). Direct Vite production build passed renderer, Electron main, and preload bundles. Direct TypeScript check still reports the pre-existing 12 unused-symbol diagnostics in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx; no diagnostics in changed selection/caller code. Full direct Vitest ran 50 files with 195 passed and 11 unrelated baseline failures plus one jsdom media error. pnpm validation commands were blocked by pinned pnpm registry-signature verification before tool execution.

2026-08-03 feedback: direct clicks do not toggle cards because ancestor pointer capture steals the click path; marquee also leaves browser text-selection highlighting. Fix must preserve normal click behavior and suppress native selection only for drag.

Feedback fix validation: direct pointer-click and selectstart regression tests pass; changed-behavior run passed 5 tests across GalleryAssetLibrary and useGenSpaceGallery. Full direct Vitest: 50 files, 197 passed, 11 pre-existing failures, and one jsdom HTMLMediaElement.play error. Direct Vite production build passed renderer, Electron main, and preload. Direct tsc remains limited by the same 12 pre-existing TS6133 diagnostics.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed Asset Library multi-select interaction regressions. Pointer clicks now remain on cards because marquee pointer capture starts only after drag threshold; multi-select surface prevents native selectstart, applies userSelect none, and clears existing ranges during marquee. Regression coverage passes for click, keyboard, clear/delete, direct pointer click, native selection suppression, marquee, and GenSpace deletion routing. Direct Vite production build passes all three bundles. Full Vitest and tsc retain only previously documented baseline failures/diagnostics.
<!-- SECTION:FINAL_SUMMARY:END -->
