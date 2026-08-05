---
id: AIVS-023
title: Remove blocking Electron media and file I/O and base64 transport
status: Backlog
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies:
  - AIVS-017
  - AIVS-018
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/06_PR_ASYNC_ELECTRON_FILE_AND_MEDIA_IO.md
priority: high
type: enhancement
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 06. Keep Electron’s main event loop responsive during media reads, imports, copies, moves, searches, writes, and deletes. Replace full-file base64 transfer with typed binary data and make the preload contract single-source.

This PR is about AiVS application responsiveness; it does not change generation or WanGP. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No user-triggered large media read/copy/move/search path uses synchronous filesystem calls in Electron main.
- [ ] #2 Local media bytes cross IPC without base64.
- [ ] #3 Renderer no longer uses `atob` for local media reads.
- [ ] #4 Preload and renderer use one `ElectronAPI` interface.
- [ ] #5 Duplicate import strategies preserve behaviour.
- [ ] #6 Cross-device move fallback preserves behaviour.
- [ ] #7 PR 00 path-boundary tests remain green and asynchronous conversion does not weaken validation or containment.
- [ ] #8 Large import/read does not freeze normal window interaction in the manual benchmark.
- [ ] #9 The project-asset import test exercises production code.
- [ ] #10 Focused test, typecheck, renderer/Electron/preload build pass.
- [ ] #11 No UI layout tests are added.
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
