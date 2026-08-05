---
id: AIVS-020
title: Share backend lifecycle and curated model-profile loading
status: Backlog
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies:
  - AIVS-018
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/03_PR_SHARED_BACKEND_LIFECYCLE_AND_MODEL_PROFILES.md
priority: high
type: enhancement
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 03. Replace duplicate backend-health subscriptions, profile requests, Electron model-pack reads, and fixed retry timers with one application-level owner.

This PR changes ownership, not the `/api/model-profiles` contract or the visible model list. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Exactly one backend-health IPC subscription exists in the renderer.
- [ ] #2 Exactly one initial backend-health snapshot request exists.
- [ ] #3 App Settings no longer owns a parallel lifecycle subscription.
- [ ] #4 Opening a project causes one `/api/model-profiles` request and one `getModelPacks` request, not one per media/workspace hook.
- [ ] #5 Director uses one enabled-profile array.
- [ ] #6 Concurrent refreshes coalesce.
- [ ] #7 No profile retry timer runs while the backend is dead/restarting.
- [ ] #8 Last successful profiles remain visible during a transient backend restart.
- [ ] #9 Model-pack completion refreshes all consumers consistently.
- [ ] #10 Existing hook call sites keep a simple compatible API.
- [ ] #11 Typecheck, focused provider tests, and production build pass.
- [ ] #12 No UI placement or model-picker markup tests are added.
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
