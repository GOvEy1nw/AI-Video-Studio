---
id: AIVS-019
title: Add Custom Finetune checkpoint overrides
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-22 13:42'
updated_date: '2026-08-22 14:19'
labels:
  - models
  - settings
  - advanced
dependencies: []
modified_files:
  - backend/state/app_settings.py
  - backend/handlers/settings_handler.py
  - backend/handlers/image_generation_handler.py
  - backend/handlers/video_generation_handler.py
  - backend/handlers/director_generation_handler.py
  - backend/services/wangp_bridge.py
  - backend/tests/test_settings.py
  - backend/tests/test_wangp_bridge.py
  - frontend/contexts/AppSettingsContext.tsx
  - frontend/components/ModelPackManager.tsx
priority: medium
type: feature
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let advanced users select local finetuned checkpoint files for supported curated image and video model variants in Settings > Model Manager. AiVS must continue to own each curated profile's capabilities, defaults, and WanGP routing; a configured file replaces only that profile's base checkpoint at generation time. AiVS must not download, copy, move, or delete user-selected files.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Model Manager includes an advanced Custom Finetunes section listing each supported curated image and video model variant with controls to select and clear a local checkpoint file.
- [x] #2 Selected checkpoint paths persist in application settings and are restored after restarting AiVS.
- [x] #3 Generation for a configured profile uses its selected local checkpoint while retaining that profile's curated capabilities, defaults, and other runtime settings.
- [x] #4 Profiles without an override continue to use their existing curated base checkpoint unchanged.
- [x] #5 Missing, unsupported, or invalid selected files fail safely with a clear user-facing error and do not silently alter another profile.
- [x] #6 Model-pack download and removal behavior remains unchanged, and AiVS never downloads, copies, moves, or deletes custom checkpoint files.
- [x] #7 Focused automated checks cover settings persistence and generation-time override routing.
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
1. Persist a customFinetunes profile-to-path map in app settings and render visible curated image/video base profiles in the Settings-only Model Manager section with existing native select/clear controls.
2. Thread each selected profile path through image, video, and Director generation as an internal bridge-only setting.
3. Validate the local checkpoint, strip the internal marker, replace only the active WanGP model definition's URLs for the job, restore the definition in finally, and release cached same-ID weights only when the effective override changes or is cleared.
4. Protect settings replacement/removal and bridge routing/restoration with focused tests; run scoped type/build checks, actual Electron interaction, and independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation keeps stable curated profile/model IDs and existing WanGP defaults/LoRAs. custom_finetunes is the one settings map treated as replace-on-patch so Clear removes omitted profile keys. The bridge never writes, copies, moves, deletes, or logs checkpoint contents; it validates .safetensors/.gguf paths at submission and mutates only the in-memory active model definition for the running job. WanGP caches weights by model_type, so same-ID custom/base transitions use public WanGPSession.close() before submit; repeated use of the same override avoids a reload. Independent review initially found the nested-map Clear defect; the bounded replacement fix was re-reviewed with verdict ship.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added an advanced Custom Finetunes section to Settings > Model Manager using the existing Electron file picker. Selected checkpoint paths persist by curated profile ID until Clear, and image, video, and Director generation replace only that profile's WanGP checkpoint while retaining stable routing and curated settings. Added safe missing/format checks, cached-weight transition handling, and job-scoped restoration without managing user weight files.

Verification: focused custom finetune pytest cases 3 passed; pnpm typecheck:py reported 0 errors; pnpm build:frontend passed; git diff --check found no whitespace errors. pnpm typecheck:ts remains blocked by unrelated pre-existing unused imports in AppTitleBar.tsx and GenerationQueuePanel.tsx. Actual Electron smoke rendered the section, restored a configured LTX 2.5 Quality path as Change file/Clear, and Clear returned the row to Select file with an empty backend map. Fresh reviewer verdict: ship. No GPU checkpoint load was run because no compatible third-party finetune was supplied.
<!-- SECTION:FINAL_SUMMARY:END -->
