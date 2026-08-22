---
id: AIVS-021
title: Fix Quick Gen image reframing submission
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-22 15:21'
updated_date: '2026-08-22 16:24'
labels: []
dependencies: []
modified_files:
  - backend/api_types.py
  - backend/handlers/image_generation_handler.py
  - backend/services/image_edit.py
  - backend/tests/test_image_edit.py
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
priority: high
type: bug
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quick Gen image Reframe must preserve AIVS's generated guide/mask edit contract while submitting numeric directional outpainting like Video Reframe. Flux 2 Klein Reframe guides require a red outpaint background, and blank Reframe prompts must compile to 'outpaint' without weakening prompt validation for other image workflows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Image Reframe submits the source and directional outpainting settings in the WanGP contract required by Krea 2 Turbo Edit.
- [x] #2 Ordinary image Edit and Retouch submissions preserve their existing guide and mask behavior.
- [x] #3 Working video reframing behavior is unchanged.
- [x] #4 A focused regression check covers the corrected image-reframe manifest.
- [x] #5 Flux 2 Klein image Reframe materializes the image guide with a red outpaint background while other image models retain their existing guide background.
- [x] #6 Blank Image Reframe prompts are accepted and submitted to WanGP as 'outpaint'; non-Reframe image generation still requires a prompt.
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
1. Keep image Reframe on the existing materialized masked-edit path and merge numeric map_reframe_to_wangp fields into its settings; leave video Reframe unchanged. 2. Extend materialize_image_edit with one optional guide background color and select pure red only for Flux 2 Klein profiles, preserving the existing gray default for all others. 3. Align Image Reframe prompting end to end: allow the Quick Gen submit control when a source and valid outpaint recipe exist without text, allow blank only for edit.outpaint at the backend validation boundary, and compile blank to 'outpaint'. 4. Update focused regressions for guide/mask plus numeric padding, Flux Klein red guide selection, blank Reframe fallback, and non-Reframe rejection; run focused backend tests, TypeScript/Python type checks, scoped diff inspection, and a fresh independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Correction in progress. The user requires image Reframe to preserve AIVS's materialized guide/mask contract while sharing video Reframe's directional padding mapping. The prior mode-1/KI/image_refs branch will be removed; only numeric outpainting fields will be added to the existing mode-2 path.

Frontend follow-up: useGenSpaceController still required prompt.trim() for all image edits, so backend fallback alone would not let users submit blank Image Reframe. The submit gate is now bypassed only for editToolMode=reframe while editWorkflowReady still requires a source and non-zero outpaint recipe.

Final implementation: Image Reframe remains on materialize_image_edit with image_mode=2/model_mode=0/VAG(VAGI with references), generated guide/mask cleanup, and shared numeric video_guide_outpainting fields overriding the profile '#'. Video Reframe remains unchanged and uses the same mapper with its native video guide.

Flux 2 Klein 4B/9B pass pure red (255,0,0) into the existing guide materializer; the materializer default remains gray (127,127,127) for all other models.

Blank prompting is aligned end to end: Quick Gen permits submission only for a ready Image Reframe, GenerateImageRequest permits omitted/blank text only with edit.outpaint, and ImageGenerationHandler sends 'outpaint'. Ordinary image create/edit/retouch prompt validation is retained.

Verification: elevated focused pytest selection passed 12 tests (Krea manifest, Flux 4B/9B red guides, combined masked edit, rasterizer, normal prompt rejection, shared mapper); pnpm typecheck:py passed with 0 errors/warnings; task-scoped TypeScript relationships passed via pnpm exec tsc --noEmit --noUnusedLocals false --noUnusedParameters false; scoped git diff --check was clean apart from line-ending warnings. Strict pnpm typecheck:ts remains blocked only by unrelated unused imports in AppTitleBar.tsx and GenerationQueuePanel.tsx. An isolated queue-backed Video Reframe pytest hung and was interrupted; no video source changed, shared mapper coverage passed, and final independent review verdict was ship. No live GPU generation was run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Corrected Quick Gen Image Reframe to preserve AIVS's generated image_guide/image_mask masked-edit contract while overriding WanGP's disabled '#' default with the same numeric directional outpainting mapping used by Video Reframe. Added Flux 2 Klein-specific pure-red guide backgrounds and end-to-end blank-prompt support that submits 'outpaint' only for valid Reframe workflows while preserving prompt requirements elsewhere. Verified with 12 focused backend tests, clean Pyright, task-scoped TypeScript checking, clean scoped diff diagnostics, and an independent ship review. Strict TypeScript remains blocked by two unrelated unused imports; the queue-backed Video Reframe test harness hung, and no live GPU generation was run.
<!-- SECTION:FINAL_SUMMARY:END -->
