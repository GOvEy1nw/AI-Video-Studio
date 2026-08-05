---
id: AIVS-005.01
title: Restore full frontend test baseline
status: Done
assignee: []
created_date: '2026-08-02 09:22'
updated_date: '2026-08-02 10:00'
labels: []
dependencies: []
references:
  - 'Projectmem issue #0463'
parent_task_id: AIVS-005
priority: medium
type: bug
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Full frontend validation currently has five stale-expectation failures across GenSpace mode accents, Region Prompt disclosures, Image Edit headers, and Music Think control semantics. Reconcile tests and current intended UI behavior without changing unrelated product behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GenSpace mode accent expectations match current semantic theme tokens.
- [ ] #2 Region Prompt disclosure coverage matches current rendered structure.
- [ ] #3 Image Edit Retouch and Reframe header expectations match current accessible UI.
- [ ] #4 Music Think control has correct accessible semantics and matching test coverage.
- [ ] #5 pnpm test:frontend passes with no failures.
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
