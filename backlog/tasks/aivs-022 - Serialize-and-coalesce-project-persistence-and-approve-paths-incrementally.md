---
id: AIVS-022
title: Serialize and coalesce project persistence and approve paths incrementally
status: Ready
assignee: []
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 14:24'
labels:
  - audit
dependencies:
  - AIVS-021
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/05_PR_PROJECT_PERSISTENCE_AND_PATH_APPROVAL.md
priority: high
type: enhancement
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 05. Make project writes ordered, latest-state-wins, retryable, and cheap to schedule. Remove the full-project/full-asset path scan that currently runs on every project-state change.

This PR protects data while reducing renderer work and disk/index churn. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Only one project storage mutation is in flight at a time.
- [ ] #2 The latest project snapshot cannot be silently lost after a failed write.
- [ ] #3 Repeated updates coalesce.
- [ ] #4 Delete wins over pending save for the same project.
- [ ] #5 Index read/modify/write is serialized in Electron.
- [ ] #6 Persisted revision advances only after success.
- [ ] #7 Timeline edits no longer scan all project asset/take paths.
- [ ] #8 Project load approves unique stored paths once.
- [ ] #9 Import/generation/take creation approves only the returned new path.
- [ ] #10 Path validation/security rules are unchanged.
- [ ] #11 Project files remain atomically written and reload correctly.
- [ ] #12 Focused queue/storage tests, typecheck, and build pass.
- [ ] #13 No UI layout tests are added.
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
