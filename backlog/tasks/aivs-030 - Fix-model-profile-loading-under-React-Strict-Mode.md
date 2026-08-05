---
id: AIVS-030
title: Fix model-profile loading under React Strict Mode
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 14:35'
updated_date: '2026-08-05 14:44'
labels: []
dependencies:
  - AIVS-020
modified_files:
  - frontend/contexts/ModelProfilesContext.tsx
  - frontend/contexts/ModelProfilesContext.test.tsx
priority: high
type: bug
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Regression introduced by shared ModelProfilesProvider lifecycle handling. In React development Strict Mode, effect cleanup marks mountedRef false and setup never restores it, so valid profile responses are discarded and loading remains true indefinitely.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Curated model profiles load and loading clears after React Strict Mode effect replay.
- [x] #2 Real unmount still prevents late state updates and retry scheduling.
- [x] #3 Backend restart generation guards and model-pack trailing refresh behavior remain intact.
- [x] #4 Focused provider regression, TypeScript, and frontend production build pass.
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
1. Add a focused StrictMode provider regression reproducing permanent loading. 2. Restore mounted lifecycle state in effect setup while retaining real-unmount cleanup and request invalidation. 3. Run focused context tests, strict TypeScript, production build, diff review, and independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause confirmed in ModelProfilesProvider: mountedRef is initialized once, then Strict Mode cleanup sets it false before effect setup replay; no setup resets it true.

Reproduction evidence: root-level reactStrictMode test failed before the fix with zero profiles and permanent loading. Fix restores mountedRef during effect setup replay; same test then passes. Existing lifecycle/model-pack tests remain green. Validation: corepack pnpm test:frontend -- frontend/contexts/ModelProfilesContext.test.tsx (41 files, 164 tests pass); corepack pnpm typecheck:ts (pass); corepack pnpm build:frontend (renderer, Electron main, preload pass); git diff --check (pass). Independent review verdict: ship. Current application log confirmed backend reached alive/healthy state, isolating failure to renderer profile lifecycle.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed development-mode model loading by restoring ModelProfilesProvider mounted state when React Strict Mode replays effect setup. Added root Strict Mode regression proving profiles publish and loading clears while preserving unmount, restart, and trailing-refresh guards. Full frontend suite, TypeScript, production build, diff hygiene, and independent review pass.

User approved and requested publication to dev on 2026-08-05.
<!-- SECTION:FINAL_SUMMARY:END -->
