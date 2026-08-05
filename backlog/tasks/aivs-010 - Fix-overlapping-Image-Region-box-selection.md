---
id: AIVS-010
title: Fix overlapping Image Region box selection
status: Done
assignee:
  - '@codex'
created_date: '2026-08-03 09:54'
updated_date: '2026-08-03 15:35'
labels: []
dependencies: []
references:
  - 'C:\Mix Studio\public\app.js'
  - 'C:\Mix Studio\public\style.css'
modified_files:
  - frontend/views/genspace/image/RegionPromptEditor.tsx
  - frontend/views/genspace/image/RegionPromptEditor.test.tsx
priority: medium
type: bug
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make overlapping Image Region boxes fully editable. Users must be able to select a region beneath another box and reach its resize handle while preserving the existing overlapping canvas layout and region editing behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Overlapping region boxes remain visually layered without changing their persisted bounding boxes.
- [x] #2 Users can select an obscured region through the overlap interaction and then resize it with its visible handle.
- [x] #3 Selecting, moving, resizing, deleting, and keyboard-editing non-overlapping regions continue to work.
- [x] #4 Focused frontend tests cover overlapping selection, selected-region stacking, and resizing a previously obscured region.
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
1. Update `frontend/views/genspace/image/RegionPromptEditor.tsx` without changing persisted region data: keep array-order overlap rendering, raise selected box with a higher stacking order, add canvas-coordinate hit-testing for overlap cycling, support repeated click and long-press selection of underlying regions, suppress the post-hold/drag click, and clear interaction timers safely.
2. Extend `frontend/views/genspace/image/RegionPromptEditor.test.tsx` with overlapping default boxes, mocked canvas geometry/pointer capture, and assertions for cycling, selected stacking, lower-box resize, and preserved neighboring geometry.
3. Run the focused RegionPromptEditor test, strict TypeScript validation, the full frontend test suite, and `git diff --check`; record any pre-existing validation failures separately.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented Mix Studio-style overlap handling: selected region receives elevated z-index; repeated click on selected overlap cycles underlying regions; 520 ms hold cycles layers; 8 px drag threshold and click suppression prevent drag/hold follow-up clicks; pointer timers are cleaned up.

Focused validation: `node node_modules\\vitest\\vitest.mjs run frontend/views/genspace/image/RegionPromptEditor.test.tsx` — 3/3 tests passed. Coverage includes overlap cycling, unchanged geometry on selection, selected stacking, lower-region resize, long-press cycling, and existing edit/delete/keyboard behavior.

Production validation: `node node_modules\\vite\\bin\\vite.js build` passed renderer, Electron main, and preload bundles. `git diff --check` passed for task files.

Full direct Vitest: 185/194 passed; nine failures remain in unrelated dirty-worktree suites (GalleryAssetLibrary, GenSpaceModeTabs, ImageEditMediaInputs, ReframePanel, VideoGenPanel). Direct TypeScript: no diagnostics in task files, but unrelated TS6133 errors remain in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx. DoD type-check item left unchecked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented overlap-safe Image Region editing using Mix Studio's interaction pattern. Selected boxes are raised visually, repeated clicks cycle overlapping layers, and a 520 ms hold also cycles layers; drag/hold click suppression and guarded pointer/timer cleanup preserve move/resize behavior. Added focused regression coverage for overlap cycling, unchanged box geometry on selection, selected stacking, lower-box resize, long-press cycling, and existing region editing behavior. Validation: focused RegionPromptEditor Vitest 3/3 passed; renderer/Electron/preload Vite build passed; scoped git diff check passed. Full frontend remains 185/194 because nine unrelated dirty-worktree tests fail, and full TypeScript remains blocked by unrelated TS6133 errors.
<!-- SECTION:FINAL_SUMMARY:END -->
