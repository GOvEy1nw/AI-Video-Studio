---
id: AIVS-022
title: Serialize and coalesce project persistence and approve paths incrementally
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 15:43'
labels:
  - audit
dependencies:
  - AIVS-021
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/05_PR_PROJECT_PERSISTENCE_AND_PATH_APPROVAL.md
modified_files:
  - electron/ipc/file-handlers.ts
  - electron/preload.ts
  - electron/project-storage.ts
  - electron/project-storage.test.ts
  - frontend/contexts/ProjectContext.tsx
  - frontend/contexts/ProjectContext.test.ts
  - frontend/contexts/project-persistence-queue.ts
  - frontend/contexts/project-persistence-queue.test.ts
  - frontend/vite-env.d.ts
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
- [x] #1 Only one project storage mutation is in flight at a time.
- [x] #2 The latest project snapshot cannot be silently lost after a failed write.
- [x] #3 Repeated updates coalesce.
- [x] #4 Delete wins over pending save for the same project.
- [x] #5 Index read/modify/write is serialized in Electron.
- [x] #6 Persisted revision advances only after success.
- [x] #7 Timeline edits no longer scan all project asset/take paths.
- [x] #8 Project load approves unique stored paths once.
- [x] #9 Import/generation/take creation approves only the returned new path.
- [x] #10 Path validation/security rules are unchanged.
- [x] #11 Project files remain atomically written and reload correctly.
- [x] #12 Focused queue/storage tests, typecheck, and build pass.
- [x] #13 No UI layout tests are added.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [x] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a focused latest-snapshot project persistence queue: one mutation in flight, per-project coalescing, delete supersession, success-only persisted revisions, retained retry state.
2. Replace ProjectProvider's state-wide persistence/path-scan effects with mutation-boundary enqueueing and event-driven path handling; batch loaded unique paths once while preserving native re-selection for untrusted external media.
3. Serialize Electron save/delete/migration index mutations, retain atomic writes, and compact project/index JSON without changing storage schema or validation.
4. Add focused queue/provider/storage tests for coalescing, retry, delete ordering, serialized index writes, reload, and no timeline-triggered path scan.
5. Run focused tests, strict TypeScript, production frontend/Electron/preload build, inspect complete diff, obtain independent review, then finalize AIVS-022.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented focused latest-snapshot queue with one in-flight mutation, coalescing, delete supersession, bounded automatic retry, exposed diagnostic retry/status, and success-only persisted revisions. Serialized Electron save/delete/migration index mutations and retained compact atomic JSON writes. Replaced projects-wide path scanning with one loaded-path batch plus incremental asset/take validation; untrusted external paths still require native re-selection. Corrections added Strict Mode load gating, pre-ready mutation flush, and project-lifetime async tokens. Verification: corepack pnpm test:frontend (43 files, 175 tests passed); corepack pnpm typecheck:ts; corepack pnpm build:frontend (renderer, Electron main, preload); git diff --check. Independent final review verdict ship. Native Electron smoke not run; abrupt-process-close flush remains explicitly deferred.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-05 15:43
---
Auto-approved per explicit user instruction after all acceptance criteria, required checks, and independent ship review passed.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered ordered, coalesced, retryable project persistence and event-driven path validation without weakening filesystem security or changing storage schema. Added focused queue/provider/storage regressions for coalescing, failure retry, delete ordering, Strict Mode startup, index serialization/reload, and stale async project lifetimes. Full frontend tests (175), strict TypeScript, production renderer/Electron/preload build, diff check, and final independent ship review passed.
<!-- SECTION:FINAL_SUMMARY:END -->
