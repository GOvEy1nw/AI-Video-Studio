---
id: AIVS-006
title: Use WanGP-native prompt enhancement during generation
status: Done
assignee: []
created_date: '2026-08-02 16:04'
updated_date: '2026-08-02 18:48'
labels: []
dependencies: []
documentation:
  - docs/GENSPACE_ARCHITECTURE.md
  - backend/WANGP_BACKEND.md
modified_files:
  - frontend/types/generation.ts
  - frontend/hooks/generation/request-builders.ts
  - frontend/hooks/generation/request-builders.test.ts
  - frontend/views/genspace/logic/generation-requests.ts
  - frontend/views/genspace/logic/generation-requests.test.ts
  - frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts
  - frontend/views/genspace/hooks/useGenSpaceGenerationActions.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/hooks/useGenSpacePromptEnhancement.ts
  - frontend/views/genspace/music/compile-music-request.ts
  - backend/api_types.py
  - backend/handlers/image_generation_handler.py
  - backend/handlers/video_generation_handler.py
  - backend/handlers/music_generation_handler.py
  - backend/tests/test_generation.py
  - backend/tests/test_music_generation.py
  - docs/GENSPACE_ARCHITECTURE.md
  - backend/WANGP_BACKEND.md
priority: high
type: bug
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace AiVS submit-time prompt rewriting with WanGP generation-manifest prompt_enhancer selection. Align Image, Video, Video Relay, Video Tools, ACE-Step description LM CoT, Auto Lyrics, Instrumental, and Custom Lyrics behavior while preserving curated backend ownership, project persistence, and editable authored prompts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Image and Video generation submit prompt_enhancer as empty, T, TI, T1, or TI1 according to enhancement, relay, and enhancer-visible image state without calling the standalone enhancement endpoint
- [x] #2 Video guides do not incorrectly select TI unless WanGP receives an enhancer-visible image; Video Tools can generate with enhancement enabled
- [x] #3 ACE-Step description toggle and duration mode select model_mode 1, 2, 3, or 4 according to the approved LM CoT matrix
- [x] #4 Auto Lyrics uses WanGP generation-time prompt_enhancer T with suitable lyrics context; Instrumental submits an empty enhancer and [Instrumental]
- [x] #5 Custom Lyrics generation never auto-composes; Compose Lyrics remains an explicit editable action
- [x] #6 Generated asset and Copy Settings prompt behavior is deliberate and covered by tests
- [x] #7 Focused frontend and backend tests, TypeScript, Pyright, and relevant full suites pass or documented baseline failures remain unchanged
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
1. Compile semantic enhancement state into backend-owned WanGP manifest values. 2. Align ACE-Step Auto, Instrumental, and Custom Lyrics behavior. 3. Preserve authored prompt for AiVS assets and Copy Settings. 4. Add regressions, update contracts, and validate.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented semantic enhancePrompt transport and backend WanGP prompt_enhancer compilation. Image/video matrix is empty/T/TI/T1/TI1 from enabled, validated enhancer-visible image, and shot relay state; video/control guides and Continue Video remain text-only. Removed GenSpace standalone enhancement preflight. Auto Lyrics now uses generation-time T with song-description lyrics context; Instrumental and Custom Lyrics send empty, empty Custom is rejected, explicit Compose Lyrics remains unchanged. Validation: 36 focused frontend tests passed; backend focused regressions 136 passed; full backend 318 passed, 1 skipped; Pyright 0 errors; Vite renderer/main/preload build passed; git diff --check passed. TypeScript reports four unrelated unused-symbol errors in pre-existing ReframePanel.tsx and VideoGenPanel.tsx work. Full frontend: 177 passed, 8 unrelated current-worktree failures in GenSpaceModeTabs, RegionPromptEditor, MusicSettings, ImageEditMediaInputs, ReframePanel, and VideoGenPanel.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delegated prompt enhancement to WanGP generation manifests, preserved authored AiVS prompts, aligned ACE-Step Auto/Instrumental/Custom Lyrics behavior, and added matrix regressions. Focused frontend/backend, full backend, Pyright, build, and diff checks pass; unrelated dirty-worktree frontend baseline failures are documented.
<!-- SECTION:FINAL_SUMMARY:END -->
