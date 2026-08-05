---
id: AIVS-018
title: 'Restore a lean, green, critical-only validation baseline'
status: Ready
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies: []
documentation:
  - docs/AiVS-Code-Health-Performance-Audit/01_PR_LEAN_CRITICAL_TEST_BASELINE.md
priority: high
type: chore
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 01. Make the test/typecheck signal trustworthy before changing performance-sensitive architecture. Delete presentation-coupled tests and dead production residue instead of updating stale assertions to the latest markup.

This PR is intentionally allowed to have a large **negative** line count. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `pnpm run typecheck:ts` has zero diagnostics.
- [ ] #2 `pnpm run test:frontend` has zero failures and zero unhandled errors.
- [ ] #3 Backend focused tests pass and `pnpm run typecheck:py` passes independently.
- [ ] #4 Frontend test-case count is reduced by **at least 20%** from the pinned 208-case head baseline, without deleting the named critical contract areas.
- [ ] #5 Frontend test-file count is lower; empty/one-trivial-assertion files are removed.
- [ ] #6 No retained frontend test asserts exact Tailwind classes, pixel dimensions, sibling order, or implementation-only placement data unless the file is testing a pure geometry algorithm.
- [ ] #7 No backend pytest case invokes a linter/type checker or scans test source for style rules.
- [ ] #8 `scripts/test-project-asset-import.mjs` never reports success after testing only fallback code.
- [ ] #9 `docs/TESTING_POLICY.md` and `AGENTS.md` agree.
- [ ] #10 Production renderer/Electron/preload build succeeds.
- [ ] #11 A short manual smoke covers Home, project open, Quick Gen controls, Director open, Video Editor open, Settings, and Asset Library multi-select.
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
