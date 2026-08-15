---
id: AIVS-011
title: Split curated model profiles by media type
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-15 11:09'
updated_date: '2026-08-15 11:34'
labels: []
dependencies: []
modified_files:
  - .projectmem/PROJECT_MAP.md
  - .projectmem/summary.md
  - backend/model_profiles/audio_profiles.py
  - backend/model_profiles/image_profiles.py
  - backend/model_profiles/policies.py
  - backend/model_profiles/profiles.py
  - backend/model_profiles/types.py
  - backend/model_profiles/video_profiles.py
priority: medium
type: chore
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reduce the maintenance and review cost of the oversized curated model-profile registry while preserving all existing AiVS-visible model behavior, saved profile identifiers, ordering, validation, and backend import contracts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Curated image, video, and audio profile definitions no longer live in one oversized module.
- [x] #2 All existing profile IDs, display ordering, capabilities, defaults, pack requirements, and visibility filters remain unchanged.
- [x] #3 Existing backend imports and public model_profiles package behavior remain compatible.
- [x] #4 Focused model-profile tests and backend type checking pass.
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
1. Extract the shared profile types from the current working copy and retarget the policy module's type-only dependency.
2. Move the existing image, video, and audio definition blocks unchanged into media-owned modules, keeping family variants and helpers together.
3. Reduce profiles.py to the stable import facade, combined validation, and existing lookup/visibility functions.
4. Verify exact registry parity against the pre-refactor canonical snapshot, then run the focused model-profile tests and backend Pyright.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AIVS-010 is committed and the task now starts from a clean dev worktree. Canonical clean-dev registry snapshot: SHA256 95819c5787dff7cba3cc8f2ce6e6adfbc5e4425b19a28828c6e8044ac04c0d22; counts image/video/audio = 10/4/5.

Implemented the agreed media-type split with profiles.py retained as the explicit compatibility facade. A single shared setting-values helper remains in types.py; no duplicate family or media definitions were introduced.

Verification: canonical registry SHA256 remained 95819c5787dff7cba3cc8f2ce6e6adfbc5e4425b19a28828c6e8044ac04c0d22 with counts 10/4/5; every extracted top-level AST region and registry/getter region matched committed dev exactly; `cd backend; rtk uv run pytest tests/test_model_profiles.py -q` passed 63 tests with one pre-existing Torch deprecation warning; `rtk pnpm typecheck:py` reported 0 errors and 0 warnings. Full backend suite was not run because this is an exact code-movement refactor covered by registry parity, focused contracts, and Pyright.

Independent read-only reviewer verdict: ship, no findings and no residual risks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Split the 2,248-line curated profile monolith into shared profile types plus image, video, and audio definition modules. Kept profiles.py as the stable public facade with the same combined validation, collections, getters, role/type exports, IDs, ordering, defaults, capabilities, and pack bindings. Updated the project map and policy type-only import. Exact registry serialization and AST comparisons prove behavior parity; 63 focused tests pass and backend Pyright is clean. Independent reviewer verdict: ship.
<!-- SECTION:FINAL_SUMMARY:END -->
