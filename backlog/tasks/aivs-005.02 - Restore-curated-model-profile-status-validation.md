---
id: AIVS-005.02
title: Restore curated model profile status validation
status: Done
assignee: []
created_date: '2026-08-02 09:23'
updated_date: '2026-08-02 10:00'
labels: []
dependencies: []
references:
  - 'Projectmem issue #0461'
parent_task_id: AIVS-005
priority: medium
type: bug
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Backend validation currently fails because six curated image profiles use an empty status outside the allowed stable, experimental, or hidden contract. Restore intended profile statuses and matching current-profile expectations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every curated model profile uses a valid ProfileStatus value.
- [ ] #2 Requested image profile status expectations match intended product visibility.
- [ ] #3 uv run pyright reports zero errors and warnings.
- [ ] #4 Backend model profile and Pyright tests pass.
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
