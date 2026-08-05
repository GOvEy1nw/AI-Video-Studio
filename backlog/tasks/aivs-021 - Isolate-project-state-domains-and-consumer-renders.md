---
id: AIVS-021
title: Isolate project-state domains and consumer renders
status: Backlog
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies:
  - AIVS-019
  - AIVS-020
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/04_PR_PROJECT_STATE_RENDER_ISOLATION.md
priority: high
type: enhancement
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 04. Prevent an update in one project domain from invalidating every project consumer. Keep the current data model and mutation semantics, but expose stable, narrower context values.

This is a render-isolation refactor, not a move to Redux/Zustand and not a project-schema rewrite. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No new runtime state-management dependency.
- [ ] #2 Provider values are memoised per domain.
- [ ] #3 Asset-only consumers do not rerender on Editor/Director timeline changes.
- [ ] #4 Editor timeline consumers do not rerender on asset favourite/bin changes.
- [ ] #5 Director timeline consumers do not rerender on Video Editor timeline changes.
- [ ] #6 Navigation/tab changes do not recreate asset/timeline action callbacks.
- [ ] #7 GenSpace, Director, Video Editor, Home, and Project no longer use the broad compatibility `useProjects()` hook.
- [ ] #8 Unchanged arrays/objects retain reference identity.
- [ ] #9 Existing project schema and persisted JSON remain unchanged.
- [ ] #10 Submission results still save to the submission project if the user switches projects during generation.
- [ ] #11 One render-isolation test passes.
- [ ] #12 Existing critical project/persistence tests, typecheck, and production build pass.
- [ ] #13 No tests inspect component layout or class names.
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
