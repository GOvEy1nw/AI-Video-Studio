---
id: AIVS-004
title: Add model variant 'chips' to the model picker
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-01 16:36'
updated_date: '2026-08-01 17:58'
labels: []
dependencies: []
modified_files:
  - frontend/components/ModelPicker.tsx
  - frontend/components/ModelPicker.test.tsx
  - frontend/components/ModelDropdownTrigger.tsx
  - frontend/components/SettingsDropdown.tsx
  - frontend/views/genspace/image/ImageModelControls.tsx
  - frontend/views/genspace/music/MusicGenPanel.tsx
  - frontend/views/genspace/video/VideoGenPanel.tsx
type: enhancement
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Please add selectable model variant 'chips' to the model picker (and also make them visible in the dropdown), to reduce the number of repeated base models in the dropdown list and make it easier for users to switch between model variants. Of course, variants should only be shows together if they're capable of the same action (eg, Ace step fast & xl both generate music so should both show, but qwen image create & qwen image edit wont because one only shows in the gen mode and one only shows in the edit mode).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Installed profiles in current mode that share one model family appear once with selectable variant chips in closed picker and dropdown.
- [x] #2 Selecting any variant chip updates exact profile ID and selected styling without grouping profiles unavailable in current mode.
- [x] #3 Single-variant families retain normal picker behavior; installed-only filtering and Download models recovery remain unchanged.
- [x] #4 Focused UI/unit tests cover family grouping, direct chip selection, dropdown chip selection, and mode-scoped separation.
- [x] #5 Grouped model-family label in dropdown is clickable and selects the first displayed variant, then closes the menu.
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
1. Keep existing family/chip grouping and make only the grouped dropdown family label an accessible button targeting its first option. 2. Add regression coverage for family-label selection, first-variant ordering, and menu closure. 3. Rerun focused model-picker tests, strict TypeScript, frontend build, full frontend suite, and diff check; record evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented shared ModelPicker grouping current mode-filtered installed profiles by existing WanGP family metadata. Added accessible direct and dropdown variant chips; migrated image, video, and music pickers while retaining Download models recovery. Focused 13 tests and strict TypeScript pass.

Verification: node node_modules/vitest/vitest.mjs run ModelPicker, SettingsDropdown, ImageModelControls, MusicGenPanel, and VideoGenPanel tests: 5 files/13 tests passed. Cached pnpm typecheck:ts passed. Cached pnpm build:frontend passed. git diff --check passed. Full frontend suite: 41 files/163 tests passed; five unrelated existing stale assertions remain under projectmem issues #0448 and #0452. No documentation change required because profile/API contracts and ownership remain unchanged. Native Electron visual smoke not available in this managed session; DOM interaction coverage verifies chip selection and dropdown closure.

Human review requested one interaction refinement: clicking grouped family label should select first displayed variant instead of requiring a chip click.

Follow-up implemented: grouped family label is now an accessible button that selects first displayed variant and closes menu. Regression test selects XL, clicks ACE-Step 1.5 family label, verifies Fast selected and menu closed. Validation: 5 focused files/14 tests passed; strict TypeScript passed; frontend production build passed; git diff --check passed. Full frontend suite: 41 files/164 tests passed, with same five unrelated known stale assertions under #0448/#0452.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Model picker now supports both interaction paths: click a variant chip for an exact choice, or click grouped family name to select its first displayed variant and close dropdown. Existing grouping, installed-only filtering, and recovery behavior remain intact. Verified by 14 focused tests, strict TypeScript, production build, and diff check; full suite retains five unrelated known failures.
<!-- SECTION:FINAL_SUMMARY:END -->
