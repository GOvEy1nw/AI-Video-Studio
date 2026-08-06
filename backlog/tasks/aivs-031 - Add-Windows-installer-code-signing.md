---
id: AIVS-031
title: Add Windows installer code signing
status: Backlog
assignee: []
created_date: '2026-08-06 08:34'
labels:
  - release
  - electron
dependencies: []
priority: medium
type: task
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Release installers are currently not Authenticode-signed. Add an approved certificate/configuration and verify the published Windows installer signature without weakening local build support.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Published Windows installer has a valid Authenticode signature from the approved publisher
- [ ] #2 Unsigned local development builds remain supported and clearly identified
- [ ] #3 Release documentation describes required signing configuration without storing secrets
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
