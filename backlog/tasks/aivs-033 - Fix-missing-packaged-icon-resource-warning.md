---
id: AIVS-033
title: Fix missing packaged icon resource warning
status: Backlog
assignee: []
created_date: '2026-08-06 08:35'
labels:
  - electron
  - packaging
dependencies: []
priority: low
type: bug
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Installed app logs that resources/icon.ico is missing even though the executable icon is visible. Align packaged resource lookup/configuration so startup no longer emits the warning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Installed Windows app starts without the missing resources/icon.ico warning
- [ ] #2 Window and executable icons remain correct in unpacked and installed builds
- [ ] #3 Packaging configuration uses a valid packaged resource path
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
