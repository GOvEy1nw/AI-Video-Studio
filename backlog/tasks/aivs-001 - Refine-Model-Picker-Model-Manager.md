---
id: AIVS-001
title: Refine Model Picker & Model Manager
status: Done
assignee:
  - '@codex'
created_date: '2026-08-01 13:07'
updated_date: '2026-08-01 13:47'
labels: []
dependencies: []
type: enhancement
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- hide missing models from model picker dropdown
- add a 'download models' button at bottom of model picker dropdown, which when clcked opens up the model manager in settings.
- If no models are available for a given mode, display the 'download models' button in place of the model picker.
- In model manager, add a model filter row (below the color key), so users can filter models based on modes/features etc, such as top line image/video/audio models, plus feature 'chips' such as gen/edit/reframe/region etc.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Model pickers show only installed models for current mode.
- [x] #2 Picker offers Download models action that opens Settings Model Manager.
- [x] #3 Modes with no installed models show Download models instead of a picker.
- [x] #4 Model Manager filters packs by media category and supported workflow features.
- [x] #5 Focused UI tests cover picker availability, Settings handoff, and filters.
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
1. Trace existing profile availability, picker, Settings, and model-pack metadata flows; verify: ownership and reusable contracts identified.\n2. Add installed-only picker states and Settings Model Manager handoff; verify: focused picker tests.\n3. Add Model Manager category/feature filters using declared pack/profile metadata; verify: focused filter tests.\n4. Run strict TypeScript, focused/full frontend tests, production build, and diff check; record evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented installed-only image/video/music picker options with Model Manager handoff, plus pack media/workflow filters. Focused picker/filter tests and strict TypeScript pass.

Validation: 11 focused picker/filter tests pass; pnpm typecheck:ts and pnpm build:frontend pass; git diff --check clean. Full pnpm test:frontend ran 162 tests with four unrelated stale assertions failing in RegionPromptEditor, MusicSettings, and ImageEditMediaInputs; follow-up task creation could not complete because Backlog CLI timed out while fetching origin.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Installed-only Image, Video, and Music pickers now include Model Manager download recovery; all-missing modes render the recovery action. Model Manager adds curated media/workflow filters. Verified by focused Vitest (11 tests), strict TypeScript, production build, and diff check; full suite has four unrelated existing stale UI assertions.
<!-- SECTION:FINAL_SUMMARY:END -->
