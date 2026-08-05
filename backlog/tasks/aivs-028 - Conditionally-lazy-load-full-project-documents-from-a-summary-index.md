---
id: AIVS-028
title: Conditionally lazy-load full project documents from a summary index
status: Ready
assignee: []
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 14:24'
labels:
  - audit
dependencies:
  - AIVS-021
  - AIVS-022
  - AIVS-024
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/11_PR_CONDITIONAL_LAZY_PROJECT_LOADING.md
priority: medium
type: enhancement
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 11. Stop reading/parsing every historical project document before Home can show the project list.

**Do not start implementation until the measurement gate passes.** This PR adds meaningful storage/state complexity and is unnecessary for users with a small project collection. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The measurement gate and before values are recorded.
- [ ] #2 Home project list loads from summaries without parsing every full project.
- [ ] #3 V1 storage migrates safely and atomically.
- [ ] #4 Opening a project loads only that document unless another is pinned/active.
- [ ] #5 Home cards use static thumbnails/placeholders and no video elements.
- [ ] #6 Active generation/project persistence remains project-safe across navigation.
- [ ] #7 Dirty/in-flight projects are never evicted.
- [ ] #8 Summary updates occur only after successful document persistence.
- [ ] #9 Startup/project-list median improves enough to justify the complexity; target at least 30% reduction in measured project-storage contribution.
- [ ] #10 Focused storage tests, typecheck, and production build pass.
- [ ] #11 No UI layout tests are added.
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
