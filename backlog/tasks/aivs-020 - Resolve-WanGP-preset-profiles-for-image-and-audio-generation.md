---
id: AIVS-020
title: Resolve WanGP preset profiles for image and audio generation
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-22 14:14'
updated_date: '2026-08-22 14:48'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Curated image and audio profiles can declare wangp_preset_profile_id, but their generation handlers do not resolve the WanGP preset settings before submission as the video handler does. Apply the same profile-resolution contract without changing stable AiVS profile IDs or the WanGP-only generation path.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Image generation resolves and applies the selected profile's wangp_preset_profile_id before WanGP submission
- [x] #2 Music and speech generation resolve and apply any configured wangp_preset_profile_id before WanGP submission; the MMAudio SFX postprocessor remains unchanged because its API has no model preset settings input
- [x] #3 Existing accelerator resolution, explicit request settings, custom finetune overrides, and profiles without a preset remain behaviorally compatible
- [x] #4 Focused backend regression coverage and Python type checking pass
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
1. Resolve WanGP model defaults, accelerator, and preset settings at the image/music/speech handler boundary using each active model type. 2. Overlay curated defaults, custom finetune/request settings, and mode-specific settings in the existing precedence order. 3. Extend the existing fake bridge and focused handler tests to prove preset IDs are forwarded and resolved values reach each submission. 4. Run the focused backend tests and Python type check, inspect the complete task diff, then obtain independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented existing WanGPBridge.resolve_profiles at the image, music, and speech handler boundaries. Image resolves after input-media chooses the active model; merge precedence is resolved settings, curated defaults, then existing custom checkpoint/output/input/request overrides. Music resolves once and copies per variation. MMAudio SFX remains unchanged because its postprocessor API has no preset-settings input. Verification: backend/.venv/Scripts/python.exe -m pytest [three AIVS-020 nodes] -q -> 3 passed in 0.17s; pnpm typecheck:py -> 0 errors; scoped git diff --check -> exit 0; independent reviewer verdict ship. Queue-backed HTTP endpoint tests hung at request time, including an unchanged baseline music test, so the new regressions exercise the same wired handlers directly.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Resolved curated WanGP preset/accelerator settings for image, music, and speech generation while preserving curated and request override precedence. Verified by three focused regressions, clean Pyright, clean scoped diff, and independent ship review.
<!-- SECTION:FINAL_SUMMARY:END -->
