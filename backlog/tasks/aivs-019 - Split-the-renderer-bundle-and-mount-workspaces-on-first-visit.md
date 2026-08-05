---
id: AIVS-019
title: Split the renderer bundle and mount workspaces on first visit
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 11:26'
labels:
  - audit
dependencies:
  - AIVS-018
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/02_PR_LAZY_RENDERER_AND_WORKSPACE_MOUNTING.md
priority: high
type: enhancement
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 02. Reduce renderer startup, parse/evaluation work, and initial project memory without sacrificing workspace state or allowing tab switches to cancel an active generation.

The core rule is:

> Load and mount a workspace when it is first needed; after it has been visited, keep it mounted and explicitly inactive.

This is a conservative intermediate step. It removes the largest eager cost while preserving the current state-retention contract. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Production manifest shows Project outside the initial Home entry.
- [x] #2 Director, Video Editor, Settings, and ModelPackManager are absent from the initial Home static import graph.
- [x] #3 On project open, only the selected initial workspace is mounted.
- [x] #4 First tab hover/focus prefetches the relevant chunk without mounting it.
- [x] #5 First tab activation mounts it.
- [x] #6 Returning to a visited workspace preserves authored state.
- [x] #7 Switching away from Quick Gen does not cancel an active generation.
- [x] #8 Opening a project does not create a Director timeline until Director is visited.
- [x] #9 Inactive visited workspaces receive `isActive=false`.
- [x] #10 Bundle-report script passes and records the new chunk table.
- [x] #11 Typecheck and production renderer/Electron/preload builds pass.
- [x] #12 Only one small behavioural test is added/retained for visited-state semantics; no tests assert chunk filenames, spinner markup, or wrapper placement.
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
1. Keep code and validation in isolated AIVS-019 worktree at dev 21fa3fa; preserve unrelated main-workspace changes.
2. Lazy-load Project/setup/modals and conditionally mount closed overlays; verify Home static graph excludes those modules.
3. Lazy-load project workspaces with intent prefetch, visited-state mounting, and explicit isActive contracts; retain mounted Quick Gen jobs and guard Director initialization.
4. Enable Vite manifest reporting, add one structural bundle-report script plus measured baseline documentation, and retain one small visited-state test.
5. Run focused test, TypeScript, full frontend suite, production renderer/Electron/preload build, bundle report, diff check, native Electron smoke, and independent review; record exact evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Baseline on dev 21fa3fa: pnpm exec vite build --manifest passed. Renderer emitted one 1,084.00 kB raw / 284.22 kB gzip JS chunk; Project, all workspaces, Settings, and ModelPackManager remain in initial graph.

Implementation and verification
- App now lazy-loads Project, Python setup, Settings, and Logs; closed overlays are not mounted.
- Project tab loaders prefetch on pointer/focus intent. Only the current workspace mounts initially; visited workspaces remain mounted under hidden wrappers and receive explicit isActive.
- Director timeline creation is active-gated. Video Editor inactivity gates use isActive. Quick Gen gallery/media preview stops inactive playback while its generation hook remains mounted.
- Vite manifest enabled. pnpm bundle:report validates dynamic/static graph without hash-name or byte-budget assertions and prints raw/gzip/brotli closures. docs/PERFORMANCE_BASELINES.md records final measurements.
- Final Home static closure: 307.67 kB raw / 93.66 kB gzip / 80.97 kB brotli versus 1,084.00 kB raw / 284.22 kB gzip baseline.
- Exactly one new behavioral regression test retained: selected Quick Gen media pauses when workspace becomes inactive.
- pnpm test:frontend: 40 files, 159/159 tests passed.
- pnpm typecheck:ts: passed.
- pnpm build:frontend: renderer, Electron main, and preload passed after final lifecycle correction.
- pnpm bundle:report: passed after final build; documented table matches.
- git diff --check: passed.
- Independent review initially found hidden Quick Gen playback; correction applied and fresh verdict ship with no findings.
- Native automated journey was attempted. Corrected APPDATA/LOCALAPPDATA isolation launched Electron without appData error, but interaction remained unverified because no browser/CDP/screenshot surface was available; first attempt also collided with port 5173. All automated smoke processes were stopped. Native tab/media interaction remains manual review risk.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Split renderer startup and first-visit workspace mounting. Home now excludes Project, Director, Video Editor, Settings, and ModelPackManager static graphs; visited workspaces preserve state with explicit inactivity behavior, including paused hidden Quick Gen media without cancelling generation. Added manifest structural report and measured performance baseline. Verified 159/159 frontend tests, strict TypeScript, renderer/Electron/preload build, final bundle report, diff hygiene, and fresh independent reviewer verdict ship. Native interaction automation remained unavailable and is documented for human review.
<!-- SECTION:FINAL_SUMMARY:END -->
