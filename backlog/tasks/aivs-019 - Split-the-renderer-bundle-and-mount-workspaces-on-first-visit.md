---
id: AIVS-019
title: Split the renderer bundle and mount workspaces on first visit
status: Backlog
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies:
  - AIVS-018
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/02_PR_LAZY_RENDERER_AND_WORKSPACE_MOUNTING.md
priority: high
type: enhancement
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 02. Reduce renderer startup, parse/evaluation work, and initial project memory without sacrificing workspace state or allowing tab switches to cancel an active generation.

The core rule is:

> Load and mount a workspace when it is first needed; after it has been visited, keep it mounted and explicitly inactive.

This is a conservative intermediate step. It removes the largest eager cost while preserving the current state-retention contract. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Production manifest shows Project outside the initial Home entry.
- [ ] #2 Director, Video Editor, Settings, and ModelPackManager are absent from the initial Home static import graph.
- [ ] #3 On project open, only the selected initial workspace is mounted.
- [ ] #4 First tab hover/focus prefetches the relevant chunk without mounting it.
- [ ] #5 First tab activation mounts it.
- [ ] #6 Returning to a visited workspace preserves authored state.
- [ ] #7 Switching away from Quick Gen does not cancel an active generation.
- [ ] #8 Opening a project does not create a Director timeline until Director is visited.
- [ ] #9 Inactive visited workspaces receive `isActive=false`.
- [ ] #10 Bundle-report script passes and records the new chunk table.
- [ ] #11 Typecheck and production renderer/Electron/preload builds pass.
- [ ] #12 Only one small behavioural test is added/retained for visited-state semantics; no tests assert chunk filenames, spinner markup, or wrapper placement.
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
