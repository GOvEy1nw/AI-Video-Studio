---
id: AIVS-009
title: Restore model-pack download progress callbacks
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-13 09:32'
updated_date: '2026-08-13 09:35'
labels:
  - backend
  - regression
dependencies: []
modified_files:
  - backend/wangp_model_packs.py
  - backend/tests/test_wangp_model_packs.py
priority: high
type: bug
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Model pack downloads continue in WanGP but AiVS remains at Preparing because model dependency downloads no longer receive the structured progress callback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every model dependency download forwards the active pack progress callback to WanGP.
- [x] #2 The focused model-pack regression test fails if callback forwarding is removed.
- [x] #3 Wan2GP callback compatibility and the focused AiVS model-pack suite pass.
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
1. Restore the existing optional progress callback through _download_model_dependencies and every wgp.download_models call.
2. Restore the focused fake assertion that every dependency download receives that callback.
3. Run the AiVS model-pack suite and the Wan2GP callback compatibility suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Restored the established callback contract without changing Wan2GP: _download_pack forwards the callback into _download_model_dependencies, which passes it to all six download_models paths. Validation: backend model-pack pytest 13 passed; Wan2GP callback unittest 17 passed; pnpm typecheck:py reported 0 errors; git diff --check passed. No documentation change was required.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored live model-pack progress by forwarding the existing structured callback through every WanGP model dependency download and reinstating the all-calls regression assertion. Verified with 13 AiVS tests, 17 Wan2GP callback tests, Pyright, and diff checking.
<!-- SECTION:FINAL_SUMMARY:END -->
