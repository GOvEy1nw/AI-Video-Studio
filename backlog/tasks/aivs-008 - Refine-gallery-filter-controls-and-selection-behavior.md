---
id: AIVS-008
title: Refine gallery filter controls and selection behavior
status: Done
assignee:
  - '@codex'
created_date: '2026-08-02 17:53'
updated_date: '2026-08-02 18:48'
labels: []
dependencies: []
modified_files:
  - frontend/components/GalleryAssetLibrary.test.tsx
  - frontend/components/GalleryAssetLibrary.tsx
  - frontend/components/GalleryFilters.tsx
  - frontend/index.css
  - frontend/lib/gallery-filters.ts
priority: medium
type: enhancement
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Improve shared gallery filters so media-type and source filtering are compact, understandable, and mutually exclusive within each filter group. Keep gallery filtering project-safe and preserve unrestricted results when a group has no active selection.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Image, video, and audio media filters render as icons instead of visible text while retaining accessible names and usable hover identification.
- [x] #2 Generated and uploaded source filters render as icons instead of visible text while retaining accessible names and usable hover identification.
- [x] #3 At most one media-type filter can be selected at a time; selecting another media type replaces the current selection and selecting the active type clears the media filter.
- [x] #4 At most one source filter can be selected at a time; selecting another source replaces the current selection and selecting the active source clears the source filter.
- [x] #5 Media and source selections combine correctly, and clearing either group restores that group to an unrestricted state.
- [x] #6 Gallery scrollbars remain hidden until the gallery is hovered, without removing scrolling or keyboard accessibility.
- [x] #7 Focused gallery tests cover icon filter controls, mutual exclusivity, clearing behavior, combined filtering, and hover-only scrollbar styling.
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
1. Update shared `GalleryFilters` controls to render icon-only media/source buttons with accessible names and hover titles, keeping group semantics intact.
2. Change the shared filter toggle helper so each media and source group toggles between no selection and exactly one selected value; retain the existing filter-state shape and AND filtering pipeline for compatibility.
3. Add a scoped hover-only scrollbar style in `frontend/index.css` and apply it to the main `GalleryAssetLibrary` scroll container without changing scroll behavior.
4. Extend `frontend/components/GalleryAssetLibrary.test.tsx` with icon-control, replacement/clear, combined-filter, and scrollbar-class coverage.
5. Run focused Vitest coverage, strict TypeScript, frontend production build, and `git diff --check`; record any pre-existing worktree failures separately.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete. GalleryFilters now maps Image/Video/Music/Sparkles/Upload icons to icon-only buttons with aria-label and title; filter toggles replace the active value or clear it, preserving the existing array state and AND filtering contract.

GalleryAssetLibrary main scroll area now uses the scoped gallery-scrollbar class. Base track/thumb are transparent and hover restores the existing scrollbar colors; scrolling remains enabled.

Verification: direct Vitest controls run passed 1 file / 5 tests (4 unrelated card tests skipped). Direct Vite production build passed renderer, Electron main, and preload bundles. git diff --check passed with existing worktree LF/CRLF warnings.

Repository-wide direct TypeScript reported no diagnostics in changed filter/test/CSS paths, but remains blocked by pre-existing unused symbols in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx. Full direct Vitest ran 48 files / 190 tests with 180 passed and 10 pre-existing failures across GalleryAssetCard, GenSpace mode accent, Image Edit, Region Prompt, Music Settings, Reframe, and Video Tools. The package-manager script was also blocked before execution by offline pnpm signature verification.

Existing unrelated GalleryAssetLibrary.tsx worktree edits were preserved; its two pre-existing card tests still fail because removed Use image and metadata markup are outside this task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented gallery filter refinement across the shared Asset Library. Media and source filters now use icon-only accessible buttons with hover titles; each group permits one active value and clicking the active value clears it. Gallery filtering still combines media and source selections with AND semantics and treats empty groups as unrestricted. Main gallery scrollbars are visually transparent until hover while scrolling remains enabled.

Changed: frontend/components/GalleryFilters.tsx, frontend/lib/gallery-filters.ts, frontend/components/GalleryAssetLibrary.tsx, frontend/index.css, and focused GalleryAssetLibrary tests.

Verification: direct Vitest controls passed 5 tests; direct Vite production build passed renderer, Electron main, and preload; git diff --check passed with existing line-ending warnings. Full Vitest passed 180/190, with 10 failures already present in unrelated UI/card areas. Direct TypeScript remains blocked by pre-existing unused-symbol errors in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx. pnpm validation was blocked by offline registry signature verification.
<!-- SECTION:FINAL_SUMMARY:END -->
