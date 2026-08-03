---
id: AIVS-005.03
title: Reconcile bundled WanGP source version metadata
status: Done
assignee: []
created_date: '2026-08-02 09:23'
updated_date: '2026-08-02 10:00'
labels: []
dependencies: []
references:
  - 'Projectmem issue #0464'
parent_task_id: AIVS-005
priority: medium
type: bug
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bundled WanGP reports version 12.3456 while scripts/wangp-source.json records 12.345, causing source-integrity validation to fail. Reconcile canonical metadata without changing the pinned source revision unintentionally.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 WanGP manifest version matches the bundled runtime version exactly.
- [ ] #2 Immutable WanGP revision and transactional update contracts remain unchanged unless an intentional update is approved.
- [ ] #3 Backend WanGP source validation test passes.
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
