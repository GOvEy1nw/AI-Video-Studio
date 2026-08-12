---
id: AIVS-006
title: Use installed model-pack footprints for approximate sizes
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-12 12:38'
updated_date: '2026-08-12 12:45'
labels:
  - models
  - downloads
  - electron
dependencies: []
priority: medium
type: enhancement
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace stale hand-maintained model-pack size labels with approximate values derived from the files resolved by WanGP's model-manager pack pipeline. Use the user's complete installed AiVS model set as the local evidence source while preserving shared-file semantics and avoiding model downloads.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every AiVS-supported model pack displays an explicit approximate size based on its resolved installed files.
- [x] #2 Shared files are counted once within a pack and no model weights are downloaded or modified while measuring.
- [x] #3 The existing Model Manager download/install behavior and live transfer progress remain unchanged.
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
1. Use the existing WanGP-resolved installed pack manifest as the measurement source, deduplicate paths within each pack, and calculate decimal GB values without downloading or modifying weights. 2. Replace the static catalogue labels with the measured one-decimal values prefixed by ~; keep runtime model-pack listing, installation, and live transfer progress unchanged. 3. Update the focused catalogue expectation, reconcile all 19 values against the manifest, run focused Vitest and TypeScript checks, and inspect the complete intended diff.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured all 19 supported packs from the existing LocalAppData/AiVS model-pack-state.json produced by the WanGP model-manager resolution path. Each pack had zero missing files; duplicate paths were counted once and sizes were converted to decimal GB with one decimal. Updated only the static catalogue and its focused MMAudio expectation; no runtime scan or download behavior changed. Validation so far: exact reconciliation 19/19; focused electron/python-setup.test.ts 2/2; TypeScript typecheck passed; focused diff check passed. An accidentally broad Vitest invocation also showed the target passing but three unrelated pre-existing suites failing, so it was replaced with the correct focused command.

Final validation: manifest reconciliation matched 19/19 supported packs; focused Vitest passed 2/2; pnpm typecheck:ts passed; pnpm build:frontend built renderer, Electron main, and preload; git diff --check passed. Independent reviewer verdict: ship with no P0-P2 findings. No documentation change was needed because the UI labels themselves now state approximation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated all 19 Model Manager size labels to ~ decimal-GB values measured from the complete WanGP-resolved installed manifests, counting duplicate paths once. MiniMax H3 is now ~74.7 GB and LTX 2.3 Turbo ~42.1 GB. Runtime download, installation, and progress behavior are unchanged. Verified by 19/19 manifest reconciliation, focused Vitest 2/2, TypeScript typecheck, frontend/Electron/preload production build, diff check, and independent ship review.
<!-- SECTION:FINAL_SUMMARY:END -->
