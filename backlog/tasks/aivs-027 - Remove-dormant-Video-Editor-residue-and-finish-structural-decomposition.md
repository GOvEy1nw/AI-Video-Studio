---
id: AIVS-027
title: Remove dormant Video Editor residue and finish structural decomposition
status: Backlog
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies:
  - AIVS-026
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/10_PR_VIDEO_EDITOR_STRUCTURAL_CLEANUP.md
priority: medium
type: enhancement
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 10. Reduce maintenance and review cost in `VideoEditor.tsx` after its hot paths are optimised. Remove unreachable UI/plumbing while preserving persisted-data compatibility, then extract coherent visible sections.

This is not a behaviour redesign and should not produce a new giant controller hook. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dead/dormant inventory is attached to the Backlog task/PR.
- [ ] #2 Provably unreachable UI/state/imports are deleted, not archived in source.
- [ ] #3 Existing saved project/timeline/effect data still loads and saves without destructive loss.
- [ ] #4 `VideoEditor.tsx` becomes a route/container rather than the owner of every editor concern.
- [ ] #5 Extracted modules have clear, non-overlapping ownership.
- [ ] #6 No new monolithic `useVideoEditorController`.
- [ ] #7 No broad barrel exports or one-file folder trees.
- [ ] #8 Total production line count falls after cleanup.
- [ ] #9 Existing editor behaviour and performance from PR 09 are preserved.
- [ ] #10 Critical tests, typecheck, production build, and manual editor smoke pass.
- [ ] #11 No layout/presentation tests are added.
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
