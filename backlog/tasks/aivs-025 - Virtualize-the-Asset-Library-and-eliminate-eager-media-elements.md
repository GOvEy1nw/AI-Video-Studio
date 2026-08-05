---
id: AIVS-025
title: Virtualize the Asset Library and eliminate eager media elements
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 17:34'
labels:
  - audit
dependencies:
  - AIVS-024
documentation:
  - docs/AiVS-Code-Health-Performance-Audit/08_PR_VIRTUAL_ASSET_LIBRARY.md
modified_files:
  - frontend/components/GalleryAssetLibrary.tsx
  - frontend/components/GalleryAssetList.tsx
  - frontend/components/asset-library-virtual.ts
  - frontend/components/GalleryAssetLibrary.test.tsx
  - frontend/components/asset-library-virtual.test.ts
  - docs/AiVS-Code-Health-Performance-Audit/08_PR_VIRTUAL_ASSET_LIBRARY.md
priority: high
type: enhancement
ordinal: 3500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 08. Make Asset Library CPU, DOM, image decode, video metadata, waveform, and pointer-selection cost depend on the visible viewport rather than the full filtered project library.

The shared component is used by Quick Gen, Director, and Video Editor, so one focused change benefits all three. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grid and list render a bounded viewport/overscan subset for 1,000 logical assets.
- [x] #2 Target rendered card count remains below 200 in the standard sidebar fixture unless measured row geometry justifies another documented bound.
- [x] #3 No `<video>` elements are created for Asset Library grid/list cards.
- [x] #4 Offscreen/unmounted audio cards do not request waveforms.
- [x] #5 Images use lazy/async decoding.
- [x] #6 Marquee pointer movement does not rerender every card on each event.
- [x] #7 Selection/filter/bin/favourite/take/delete/context-menu behaviour remains correct.
- [x] #8 Quick Gen leading generation/import content renders correctly outside virtual assets.
- [x] #9 Hidden/inactive workspaces do not start new card media work.
- [x] #10 Focused critical tests, typecheck, and production build pass.
- [x] #11 No tests assert card layout/classes/pixel positions.
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
1. Add Asset Library-specific row virtualization without a new dependency: derive grid rows/list sorting, measure the existing scroll viewport, render only visible rows plus bounded overscan, and keep leading content outside virtual assets. 2. Preserve stable asset/selection/action semantics across grid/list while making image cards lazy/async and ensuring mounted-only thumbnail/waveform work. 3. Move marquee box motion to a ref plus requestAnimationFrame DOM writes so pointer moves do not update React/card trees; commit selection once on pointer-up. 4. Add focused pure/critical tests for 1,000-asset bounded rendering and selection/leading-content behavior without layout/class assertions; record DOM bound measurement. 5. Run focused tests, strict TypeScript, production build, diff inspection, independent review, documentation/finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Baseline revalidated on dev c952bd7: grid and list map all display assets; list creates a new default Set; images lack lazy/async flags; marquee pointer move writes React state each event; AIVS-024 already removed card video fallbacks and added media visibility gates. @tanstack/react-virtual is not installed, so task uses a small Asset Library-specific fixed-row implementation and no dependency.

Implemented dependency-free fixed-row virtual grid/list with three-row overscan, body-relative scroll offsets, lazy/async images, mounted-only media consumers, and rAF DOM marquee updates. Initial review found leading-content/header offset regressions; corrected while preserving Quick Gen grid/list leading layout and added list bound coverage. Measurement: 1,000-asset standard grid calculation mounts 44 cards; grid/list component probes remain below 200. Verification: 7 focused Vitest cases passed; pnpm typecheck:ts passed; pnpm build:frontend passed; git diff --check passed. Fresh independent review verdict: ship. Native Electron top/middle/bottom scroll/resize and leading-content visual smoke not run.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-05 17:34
---
Auto-approved under user's explicit instruction to approve, publish, and merge each completed AIVS-024 through AIVS-029 task.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
AIVS-025 makes shared Asset Library grid/list DOM and media work viewport-bounded, preserves leading content and selection/actions, lazy-decodes images, and removes React marquee updates per pointer move. Verified with 1,000-asset bounds, 7 focused tests, strict TypeScript, production build, diff check, and ship review.
<!-- SECTION:FINAL_SUMMARY:END -->
