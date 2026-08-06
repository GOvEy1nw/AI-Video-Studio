---
id: AIVS-032
title: Fix installed-app updater HTTP 406
status: Backlog
assignee: []
created_date: '2026-08-06 08:34'
labels:
  - electron
  - updater
dependencies: []
priority: medium
type: bug
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Installed AiVS update checks can receive HTTP 406 from GitHub Releases. Diagnose the installed-app request path and restore reliable update availability checks while preserving current failure-safe startup behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Installed app update check completes without GitHub Releases HTTP 406
- [ ] #2 No-update and network-failure states remain non-fatal and actionable
- [ ] #3 Focused updater validation covers the corrected request contract
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
