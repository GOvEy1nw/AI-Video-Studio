---
id: AIVS-025
title: Virtualize the Asset Library and eliminate eager media elements
status: Backlog
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies:
  - AIVS-024
documentation:
  - docs/AiVS-Code-Health-Performance-Audit/08_PR_VIRTUAL_ASSET_LIBRARY.md
priority: high
type: enhancement
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 08. Make Asset Library CPU, DOM, image decode, video metadata, waveform, and pointer-selection cost depend on the visible viewport rather than the full filtered project library.

The shared component is used by Quick Gen, Director, and Video Editor, so one focused change benefits all three. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grid and list render a bounded viewport/overscan subset for 1,000 logical assets.
- [ ] #2 Target rendered card count remains below 200 in the standard sidebar fixture unless measured row geometry justifies another documented bound.
- [ ] #3 No `<video>` elements are created for Asset Library grid/list cards.
- [ ] #4 Offscreen/unmounted audio cards do not request waveforms.
- [ ] #5 Images use lazy/async decoding.
- [ ] #6 Marquee pointer movement does not rerender every card on each event.
- [ ] #7 Selection/filter/bin/favourite/take/delete/context-menu behaviour remains correct.
- [ ] #8 Quick Gen leading generation/import content renders correctly outside virtual assets.
- [ ] #9 Hidden/inactive workspaces do not start new card media work.
- [ ] #10 Focused critical tests, typecheck, and production build pass.
- [ ] #11 No tests assert card layout/classes/pixel positions.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria are satisfied
- [ ] #2 Relevant automated tests pass
- [ ] #3 Lint, type-check, and build checks pass where applicable
- [ ] #4 Documentation is updated where required
- [ ] #5 Implementation summary and verification evidence are recorded
- [ ] #6 No unrelated changes are included
<!-- DOD:END -->
