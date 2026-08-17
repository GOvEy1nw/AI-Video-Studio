---
id: AIVS-014
title: Add MiniMax Music 3 to Quick Gen music models
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-16 14:51'
updated_date: '2026-08-16 15:24'
labels: []
dependencies: []
modified_files:
  - backend/handlers/music_generation_handler.py
  - backend/model_profiles/audio_profiles.py
  - backend/tests/test_music_generation.py
  - backend/tests/test_music_profiles.py
  - backend/tests/test_wangp_model_packs.py
  - backend/wangp_model_packs.py
  - electron/python-setup.test.ts
  - electron/python-setup.ts
  - frontend/types/music.ts
  - frontend/views/genspace/hooks/useGenSpaceSettingsState.ts
  - frontend/views/genspace/music/MusicAdvancedSettings.tsx
  - frontend/views/genspace/music/MusicGenPanel.tsx
  - frontend/views/genspace/music/MusicMediaInputs.tsx
  - frontend/views/genspace/music/MusicSettings.tsx
  - frontend/views/genspace/music/compile-music-request.ts
  - frontend/views/genspace/music/compile-music-request.test.ts
priority: high
type: feature
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add MiniMax Music 3 as a curated local music-generation option in AiVS so users can select, download, and generate with it through the existing WanGP-backed Music workflow without changing existing music-model behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 MiniMax Music 3 appears as a selectable music model with accurate user-facing metadata in Quick Gen.
- [x] #2 Selecting MiniMax Music 3 compiles a valid local WanGP music-generation request using the model's supported controls and defaults.
- [x] #3 The model manager can report and download every dependency required for MiniMax Music 3 through the existing model-pack flow.
- [x] #4 Existing music models and saved Music workflows continue to work unchanged.
- [x] #5 Focused automated checks cover the curated profile, request mapping, and model-pack dependency contract, and relevant type checks pass.
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
1. Add one experimental `minimax_music3` curated audio profile with verified MiniMax Music 3 license metadata, lyrics/description/duration policy, and its matching model pack in the existing backend/Electron registries.
2. At the shared music handler boundary, translate AiVS Auto Lyrics and description-enhancement choices to MiniMax Music 3's registered WanGP prompt-enhancer selections while leaving the ACE-Step mapping untouched.
3. Make the existing Music UI/compile path honor each profile's supported vocal modes and reference-audio/creative controls so switching models cannot submit unsupported stale settings.
4. Extend the nearest profile, generation, pack, and request-compilation tests; run focused backend/frontend tests and both relevant type checks. Resolve the pack manifest against the configured external WanGP checkout without downloading weights; leave live GPU/audio validation explicitly pending.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research evidence: external Wan2GP dev commit 6653fcf contains `minimax_music3` matching current upstream integration files. WanGP requires non-empty lyrics and Music Description, supports 1-300 second duration, rejects reference audio, and registers prompt-enhancer selections T1/L2O/B2O combinations. Official MiniMax community license has visible attribution and revenue authorization conditions. No weights or GPU generation will be downloaded/run in this task.

Verification: backend `uv run pytest tests/test_music_profiles.py tests/test_music_generation.py tests/test_wangp_model_packs.py -q` passed 35 tests (one pre-existing pynvml deprecation warning); focused frontend Music compiler/settings tests passed 5 tests; Electron model-pack catalog tests passed 4 tests; `pnpm typecheck:ts`, `pnpm typecheck:py`, `pnpm build:frontend`, and `git diff --check` passed.

Runtime pack validation: the configured external WanGP resolver returned exactly 13 MiniMax Music 3 paths without downloading weights: INT8 transformer, INT8 Qwen text encoder, tokenizer files, RVQ BF16+INT8 assets, condition encoder, vocoder, scheduler, and configs. Current Hugging Face file metadata totals approximately 15.0 decimal GB for that resolved manifest.

Independent review verdict: ship. Live model download/GPU audio generation remains intentionally pending; the profile stays experimental and does not claim a sample rate or verified instrumental behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added MiniMax Music 3 as an experimental curated Quick Gen music model backed by WanGP `minimax_music3`. The profile exposes verified lyrics/description and 1-300 second duration behavior, maps all four MiniMax prompt-enhancer combinations while preserving ACE-Step's existing mapping, and carries the official community-license attribution/revenue terms. The existing Music UI now derives vocal modes, reference-audio availability, and sampling controls from the selected backend profile, and request compilation defensively removes unsupported stale values while preserving saved recipe compatibility. Added the matching ~15.0 GB model-pack catalog entry and verified the real WanGP resolver returns all 13 expected dependency paths without downloading weights. Focused backend/frontend/Electron tests, both typechecks, production frontend/Electron/preload build, diff check, and independent review all passed. Live weight download and GPU/audio validation remain pending, so the profile is experimental.
<!-- SECTION:FINAL_SUMMARY:END -->
