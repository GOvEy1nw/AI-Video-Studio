---
id: AIVS-037
title: Fix slow dev startup and delayed project workspace rendering
status: Done
assignee:
  - Codex
created_date: '2026-08-08 12:15'
updated_date: '2026-08-08 13:49'
labels: []
dependencies: []
documentation:
  - AGENTS_PRD.md
  - docs/TESTING_POLICY.md
modified_files:
  - frontend/App.tsx
  - frontend/views/Project.tsx
  - scripts/check-renderer-bundle.mjs
  - docs/PERFORMANCE_BASELINES.md
priority: high
type: bug
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The recent renderer performance work introduced a disruptive startup regression: `codepack pnpm dev` can take several minutes to become usable, and opening a project shows a long loading state followed by a header-only black workspace where tabs and Settings are unresponsive until the renderer eventually finishes. Restore prompt, interactive project navigation without undoing legitimate workspace-state preservation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Opening a project from Home renders the active Quick Gen workspace and keeps the project header and Settings interaction responsive without a prolonged header-only black state.
- [x] #2 Switching among Quick Gen, Director, and Video Editor does not leave the workspace content permanently or unexpectedly blank while code is loading.
- [x] #3 The development startup path no longer performs the identified redundant or blocking work responsible for the multi-minute startup regression.
- [x] #4 Existing lazy-workspace state preservation and inactive-workspace behavior remain correct.
- [x] #5 The affected frontend path passes focused regression checks, TypeScript checking, and the frontend production build; native Electron behavior is smoke-checked where the environment permits.
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
1. Replace the warmup-only compromise with a hybrid renderer boundary: statically include Project, Quick Gen, and Settings so the default project journey is ready before Home is interactive; keep Director and Video Editor as intent-prefetched lazy workspaces.
2. Remove the now-redundant Vite dependency include/warmup configuration; static Quick Gen discovery will include react-dropzone during the normal initial dependency pass.
3. Update the renderer bundle guard to require the primary path to be eager while Director and Video Editor remain outside the initial static graph, then record the measured hybrid bundle size against the pre-split and fully-lazy baselines.
4. Run TypeScript, production build, bundle guard, and focused state-semantics checks; inspect the complete diff and obtain a fresh independent review before returning AIVS-037 to Human Review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Diagnosis baseline: production build transforms 1,968 renderer modules in 382 ms and completes renderer/main/preload in about 3 s, ruling out the production compiler. Cold Vite dev trace served Project.tsx in 55.387 s, then GenSpace.tsx in 16.237 s, matching the reported spinner then header-only black workspace.

Vite dependency cache completed about 43 s after dev start and omitted react-dropzone, which is imported only through lazy Quick Gen uploaders. Vite 8 documents that missed runtime dependencies trigger rebundling/reload; optimizeDeps.include and server.warmup are the supported controls for dynamic-route dependency and transform waterfalls.

Current bundle-report check is already blocked by unrelated in-progress model-profile changes: `ModelPackManager manifest chunk was not found`. Production build itself passes.

Final implementation: Vite pre-bundles react-dropzone so the lazy Quick Gen route cannot trigger runtime dependency re-optimisation/reload. Targeted dev warmup covers Project, GenSpace, GenSpaceWorkspace, and Settings; Director/Video remain intent-prefetched and now show the shared visible fallback when cold.

Final verification: `corepack pnpm run typecheck:ts` exit 0; `corepack pnpm run build:frontend` exit 0. Renderer-only warmup probe: Project 41 ms (baseline 55,387 ms/then 19,790 ms after dependency-only fix), GenSpace 789 ms (baseline 16,237 ms/then 1,720 ms), Settings 60 ms (dependency-only 13,088 ms). Vite cache includes react-dropzone.

`corepack pnpm run bundle:report` remains blocked by unrelated in-progress model-profile changes: ModelPackManager manifest chunk was not found. This failure predates and is outside the two-file AIVS-037 diff; the production build itself passes.

Native Electron smoke was attempted via a visual QA worker but could not produce interaction evidence in this environment. An earlier diagnostic launch was terminated with its stdout pipe closed, causing an EPIPE dialog; all owned AiVS Electron/Vite processes were cleaned up. This was diagnostic-process handling, not application code.

Independent reviewer verdict: ship, no findings. Residual risk: Vite warmup is asynchronous, so exceptionally fast navigation can briefly show the new explicit Loading workspace status while warmup finishes.

Human feedback invalidated the warmup-only acceptance: native Electron still displayed Loading workspace for multiple seconds. The revised boundary prioritizes perceived latency over the smallest possible Home bundle while retaining lazy loading where it has clear value.

Hybrid implementation verified: App statically imports Project and Settings; Project statically imports Quick Gen. Director and Video Editor remain dynamic entries with intent prefetch, visible fallback, first-visit mounting, and retained inactive state.

Verification: `corepack pnpm run typecheck:ts` passed; `corepack pnpm run build:frontend` passed; `corepack pnpm run bundle:report` passed; `corepack pnpm exec vitest run frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx` passed 1/1; scoped `git diff --check` passed.

Bundle result: eager Home + primary project path is 649.42 kB raw / 184.14 kB gzip / 152.14 kB brotli, remaining substantially below the 1,084.00 kB pre-split renderer. Director and Video Editor remain separate lazy closures.

A mistakenly broad `pnpm test:frontend -- <file>` invocation ran 53 files and surfaced two unrelated current failures; the correctly scoped Vitest command passed. No test files were changed.

Fresh independent reviewer verdict: ship, no findings. Remaining human-review action is native confirmation that Home-to-project now has no Loading workspace pause.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: User
created: 2026-08-08 13:20
---
Human review feedback: the first fix is better but still leaves the user on “Loading workspace...” for several seconds. Revise the lazy-loading boundary so the default project experience feels immediate, accepting a modest initial renderer cost while retaining lazy loading for secondary workspaces.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Revised AIVS-037 after native feedback showed server warmup still left a multi-second workspace pause. The final hybrid boundary eagerly loads Home, Project, Quick Gen, and Settings so the default desktop journey has no lazy/Suspense boundary; Director and Video Editor remain intent-prefetched lazy workspaces and preserve first-visit mounting/inactive behavior. Removed the redundant Vite warmup workaround, updated the renderer bundle guard for the hybrid contract, and documented the measured baseline. TypeScript, production renderer/Electron/preload build, bundle guard, focused inactive-workspace regression test, and diff hygiene pass. The eager primary graph is 649.42 kB raw versus the 1,084.00 kB pre-split renderer. Fresh reviewer verdict: ship; native user confirmation remains the Human Review step.
<!-- SECTION:FINAL_SUMMARY:END -->
