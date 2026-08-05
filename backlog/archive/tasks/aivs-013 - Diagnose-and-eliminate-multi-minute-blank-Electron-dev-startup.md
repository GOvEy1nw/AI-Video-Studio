---
id: AIVS-013
title: Diagnose and eliminate multi-minute blank Electron dev startup
status: Backlog
assignee: []
created_date: '2026-08-03 14:01'
labels:
  - electron
  - frontend
  - dev-tooling
dependencies: []
references:
  - electron/window.ts
  - frontend/App.tsx
  - 'C:/Users/rais/AppData/Local/AiVS/logs'
priority: medium
type: bug
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cold `corepack pnpm dev` launches can show a blank Electron window for 2–4 minutes before any renderer log appears. Session logs show the behavior predates AIVS-012 media-menu work and differs sharply from warm Electron restarts. Determine the delayed stage and prevent an unexplained blank window during development startup.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Cold dev startup timing identifies the delayed stage between Electron window creation and first renderer execution with reproducible evidence.
- [ ] #2 Cold dev startup no longer presents an unexplained blank Electron window while renderer modules initialize.
- [ ] #3 Warm restart behavior and production renderer/Electron/preload builds remain unaffected.
- [ ] #4 Focused automated coverage or a repeatable timing check guards the chosen startup behavior.
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
