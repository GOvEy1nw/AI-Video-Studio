---
id: AIVS-011
title: Split curated model profiles by media type
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-15 11:09'
updated_date: '2026-08-15 11:12'
labels: []
dependencies: []
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
- [ ] #1 Curated image, video, and audio profile definitions no longer live in one oversized module.
- [ ] #2 All existing profile IDs, display ordering, capabilities, defaults, pack requirements, and visibility filters remain unchanged.
- [ ] #3 Existing backend imports and public model_profiles package behavior remain compatible.
- [ ] #4 Focused model-profile tests and backend type checking pass.
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract the shared profile types from the current working copy and retarget the policy module's type-only dependency.
2. Move the existing image, video, and audio definition blocks unchanged into media-owned modules, keeping family variants and helpers together.
3. Reduce profiles.py to the stable import facade, combined validation, and existing lookup/visibility functions.
4. Verify exact registry parity against the pre-refactor canonical snapshot, then run the focused model-profile tests and backend Pyright.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Pre-refactor canonical registry snapshot from the current dirty worktree: SHA256 95819c5787dff7cba3cc8f2ce6e6adfbc5e4425b19a28828c6e8044ac04c0d22; counts image/video/audio = 10/4/5. Preserve uncommitted AIVS-010 Base/Turbo and LoRA changes already present in profiles.py.
<!-- SECTION:NOTES:END -->
