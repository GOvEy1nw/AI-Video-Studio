---
id: AIVS-004
title: Fix blank app when adding video references
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-12 08:56'
updated_date: '2026-08-12 09:16'
labels:
  - video
  - frontend
  - regression
dependencies: []
priority: high
type: bug
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adding a video reference in Quick Gen causes the Electron renderer to go blank for both MiniMax H3 and LTX video models. Diagnose the shared video-reference/trim path, fix the root renderer exception without model-specific duplication, and preserve existing image/audio reference behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Adding a video reference in MiniMax H3 does not blank or crash the renderer and the reference remains visible and editable.
- [x] #2 Adding a video reference in LTX does not blank or crash the renderer and the guide/reference remains visible and editable.
- [x] #3 The shared video trim/reference UI handles newly imported video metadata safely without regressing image or audio inputs.
- [x] #4 A focused regression check reproduces the prior failure path and passes after the fix.
- [x] #5 Strict TypeScript, the production frontend build, and an Electron smoke check pass.
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
1. Capture the renderer exception from the shared video-reference path and identify the first common failing component for H3 and LTX. 2. Add one focused regression check at that owner and apply the smallest root-cause fix without model-specific branches. 3. Run the focused test, strict TypeScript, production frontend build, and a real Electron video-reference smoke check; inspect and independently review the diff.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause: VideoTrimPanel's selection effect depended on the inline onSelectionChange callback; H3/LTX parent media updates recreated that callback, re-entering the effect until React blanked the renderer. Fixed once in the shared panel with a current-callback ref and selection-only notification dependencies. Verification: rtk pnpm exec vitest run frontend/views/genspace/components/GenSpaceControls.test.tsx (11/11 passed); rtk pnpm typecheck:ts (passed); rtk pnpm build:frontend (passed, existing chunk-size warning only); scoped git diff --check passed with line-ending notices only; independent review returned ship/no findings; Electron H3 interaction remained rendered after adding a video reference, and the user explicitly confirmed the app is working now for the reported H3/LTX behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed the H3/LTX video-reference blank-screen regression at the shared VideoTrimPanel owner by preventing callback identity changes from retriggering trim selection updates. Added one focused stateful regression covering both model paths. Focused Vitest, strict TypeScript, production frontend build, diff check, independent review, Electron interaction, and user runtime confirmation all passed.
<!-- SECTION:FINAL_SUMMARY:END -->
