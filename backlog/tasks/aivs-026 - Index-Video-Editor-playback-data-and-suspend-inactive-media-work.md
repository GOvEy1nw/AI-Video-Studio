---
id: AIVS-026
title: Index Video Editor playback data and suspend inactive media work
status: Backlog
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies:
  - AIVS-020
  - AIVS-023
  - AIVS-024
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/09_PR_VIDEO_EDITOR_PLAYBACK_HOT_PATHS.md
priority: high
type: enhancement
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 09. Remove clip/asset scans, sorting, and short-lived allocations from the playback animation-frame loop; replace live timeline video thumbnails with static images; and explicitly release/suspend media work when Video Editor is inactive.

This PR optimises existing behaviour. It does not redesign the editor or change timeline semantics. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Playback rAF contains no full clip/asset `map/filter/sort/find`.
- [ ] #2 Current visual source and transition lookup use precomputed data.
- [ ] #3 Index rebuild occurs only when clips/tracks/assets materially change.
- [ ] #4 Equivalent playback state does not trigger redundant React state updates.
- [ ] #5 Timeline clip thumbnails use static images/placeholders, not video elements.
- [ ] #6 Metadata probes run only while the editor is active and are concurrency-bounded.
- [ ] #7 Switching away stops rAF, playback, source nodes, and unneeded media resources.
- [ ] #8 Returning preserves timeline/selection/layout state.
- [ ] #9 Median playback-tick JS time is at least 30% lower on the same 500-clip fixture, or the PR records why a different measured bottleneck became dominant.
- [ ] #10 Existing timeline semantics and export output are unchanged.
- [ ] #11 Focused pure/hook tests, typecheck, and production build pass.
- [ ] #12 No layout tests are added.
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
