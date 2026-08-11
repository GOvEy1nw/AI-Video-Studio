---
id: AIVS-002
title: Add Speech mode to Audio generation
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-10 11:18'
updated_date: '2026-08-11 14:08'
labels:
  - audio
  - speech
  - wangp
dependencies: []
modified_files:
  - backend/_routes/audio_speech.py
  - backend/api_types.py
  - backend/app_factory.py
  - backend/app_handler.py
  - backend/handlers/__init__.py
  - backend/handlers/model_profiles_handler.py
  - backend/handlers/speech_generation_handler.py
  - backend/model_profiles/__init__.py
  - backend/model_profiles/policies.py
  - backend/model_profiles/profiles.py
  - backend/services/wangp_bridge.py
  - backend/tests/conftest.py
  - backend/tests/fakes/fake_wangp_bridge.py
  - backend/tests/test_speech_generation.py
  - backend/tests/test_wangp_bridge.py
  - backend/wangp_model_packs.py
  - electron/python-setup.ts
  - frontend/hooks/generation/request-builders.ts
  - frontend/hooks/generation/types.ts
  - frontend/hooks/use-generation.ts
  - frontend/hooks/use-image-profiles.ts
  - frontend/lib/apply-generation-params.ts
  - frontend/lib/media-import.test.ts
  - frontend/lib/media-import.ts
  - frontend/lib/model-profile-policy.ts
  - frontend/types/model-profiles.ts
  - frontend/types/project.ts
  - frontend/types/speech.ts
  - frontend/views/genspace/audio/AudioGenPanel.test.tsx
  - frontend/views/genspace/audio/AudioGenPanel.tsx
  - frontend/views/genspace/audio/SpeechGenPanel.tsx
  - frontend/views/genspace/components/MediaRoleMenu.tsx
  - frontend/views/genspace/hooks/useGenSpaceAudioState.ts
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/hooks/useGenSpaceGallery.ts
  - frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts
  - frontend/views/genspace/hooks/useGenSpaceMediaInputs.ts
  - frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts
  - frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts
  - frontend/views/genspace/logic/active-generation-profile.ts
  - frontend/views/genspace/logic/generation-assets.ts
  - frontend/views/genspace/logic/settings-restore.test.ts
  - frontend/views/genspace/logic/settings-restore.ts
  - frontend/views/genspace/logic/speech-request.test.ts
  - frontend/views/genspace/logic/speech-request.ts
  - frontend/views/genspace/types.ts
priority: high
type: feature
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a curated Audio > Speech workflow that lets users synthesize spoken audio locally through WanGP while preserving project-owned result persistence and the shared generation lifecycle.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Audio exposes a selectable Speech mode alongside the existing supported audio workflows.
- [x] #2 Speech mode offers only OmniVoice and Index TTS 2 as product-visible model choices.
- [x] #3 Speech requests always send prompt_enhancer as T when enhancement is enabled and as an empty string when disabled, and duration_seconds is always 0.
- [x] #4 Both speech models accept up to two voice references with project-owned lineage and video-style trim controls; one reference maps to audio_prompt_type A, while two-speaker dialogue maps to OmniVoice AB and Index TTS 2 AB2 as required by the managed WanGP runtime.
- [x] #5 With zero or one reference, users author a normal text prompt; with two references, users author ordered text segments and assign Speaker 1 or Speaker 2 to each segment.
- [x] #6 Completed speech outputs are generated through the local WanGP backend, persisted to the immutable submission project, and appear in the shared Asset Library with reusable settings.
- [x] #7 Invalid or unavailable speech configurations produce clear disabled or error states without introducing a hosted fallback.
- [x] #8 Focused frontend and backend tests verify request compilation, two-speaker payload mapping, reference trimming, segment authoring, persistence, and curated model behavior.
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
1. Evolve the typed Speech settings/recipe contract to an additive schema v2 with up to two ordered gallery-backed references (including trim start/duration/media duration), ordered speaker segments, and prompt-enhancer state; keep schema v1 Copy Settings restoration compatible.
2. Extend SpeechGenPanel using existing MediaInputSlot, MediaRoleMenu, GuideMediaTrimEditor, PromptEditor, PromptActions, and a native accessible Speaker 1/2 selector: reveal Speaker 2 after Speaker 1, provide on-demand trim for each reference, show the normal prompt for fewer than two references, and switch to ordered dialogue segments for two references with at least one non-empty segment per speaker.
3. Compile the renderer request into the exact WanGP prompt contract, sending prompt enhancer enabled state and trimmed-reference metadata. In the backend, validate at most two references, materialize trims with the established extract_audio_clip helper, clean temporary derivatives without masking completed generation, and submit explicit prompt_enhancer (T or empty), duration_seconds=0, audio_guide/audio_guide2, and model-correct dialogue type (OmniVoice AB; Index TTS 2 AB2).
4. Update curated speech policy to expose two reference inputs for both models and preserve immutable project persistence plus Copy Settings lineage for both references, trims, segments, and enhancer state.
5. Protect exact manifest mapping, trim materialization/cleanup, request compilation, v1/v2 restoration, rendered import/trim/dialogue/enhancer behavior, and remove/re-add stale-state prevention with focused tests. Run targeted pytest/Vitest, Python and TypeScript type checks, frontend build, diff checks, inspect the complete diff, and obtain fresh independent review before returning AIVS-002 to Human Review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Scope decision: ship the common single-speaker TTS workflow now. OmniVoice may generate without a reference or clone one reference voice; Index TTS 2 requires one reference voice. Dialogue, dual-reference emotion transfer, raw sampling controls, and hosted fallbacks are out of scope.

Research confirmed managed Wan2GP `AiVS` commit `aa88459` supports `omnivoice` and `index_tts2` through `WanGPSession.submit_manifest`. Both return audio-only tensors that the generic runtime saves as WAV paths in AiVS's configured output directory; existing job cancellation reaches each pipeline's cooperative `_interrupt` flag. Index TTS 2's local bilibili model-use license is not permissive and must be represented accurately in curated profile metadata.

Final verification: backend/.venv/Scripts/python.exe -m pytest backend/tests/test_speech_generation.py backend/tests/test_wangp_bridge.py backend/tests/test_model_profiles.py backend/tests/test_wangp_model_packs.py -q -> 106 passed, one unrelated pynvml deprecation warning.

Final verification: backend/.venv/Scripts/pyright.exe . (from backend) -> 0 errors, warnings, or information messages; pnpm typecheck:ts -> passed.

Final verification: pnpm exec vitest run frontend/views/genspace/audio/AudioGenPanel.test.tsx frontend/views/genspace/logic/settings-restore.test.ts frontend/views/genspace/logic/active-generation-profile.test.ts frontend/lib/media-import.test.ts frontend/views/genspace/hooks/useGenSpaceGallery.test.tsx -> 5 files and 25 tests passed.

Final verification: pnpm build:frontend -> renderer, Electron main, and preload bundles built; git diff --check -- backend frontend electron -> passed; managed Wan2GP checkout remained clean.

Independent implementation review verdict: ship, with no findings. Environment limitation: no real OmniVoice/Index TTS 2 GPU generation or Electron-window smoke was run; native picker behavior is covered by focused renderer contracts but remains environment-unverified.

Human review requested an extension: explicit prompt_enhancer T/empty mapping, duration_seconds=0, up to two trimmed voice references, A/AB audio_prompt_type mapping, and a speaker-assigned segment editor when both references are present.

Managed WanGP source confirms submit_manifest preserves an explicit empty prompt_enhancer value. Dialogue mapping differs by model: OmniVoice uses AB, while Index TTS 2 uses AB2; Index AB is voice-plus-emotion, so AiVS will map Index dialogue to AB2 to achieve the requested two-speaker result. Both pipelines parse newline-delimited `Speaker 1:` / `Speaker 2:` prompt segments in order. Index's pipeline accepts duration 0 as uncapped even though its WebUI slider advertises a positive minimum; the user explicitly requested auto duration 0.

Extension verification: backend/.venv/Scripts/python.exe -m pytest backend/tests/test_speech_generation.py backend/tests/test_wangp_bridge.py -q -> 35 passed with one unrelated pynvml deprecation warning.

Extension verification: pnpm exec vitest run frontend/views/genspace/audio/AudioGenPanel.test.tsx frontend/views/genspace/logic/settings-restore.test.ts frontend/views/genspace/logic/speech-request.test.ts -> 3 files and 12 tests passed. Coverage includes import, on-demand trim/confirm, two-speaker gating, enhancer toggle, request compilation, v1/v2 restoration, and remove/re-add stale-state prevention.

Extension verification: pnpm typecheck:ts passed; backend/.venv/Scripts/pyright.exe . from backend reported 0 errors/warnings; pnpm build:frontend built renderer, Electron main, and preload; git diff --check passed; managed Wan2GP remained clean.

Independent review initially found one P2 stale-dialogue issue after reference removal. The bounded correction clears segments when dialogue exits, its rendered regression passed, and fresh rereview verdict was ship with no findings.

Environment limitation: no Electron-window visual smoke and no real OmniVoice/Index TTS 2 GPU generation were run. The UI, manifest mapping, trim materialization, and cleanup are covered by focused automated contracts.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Extended Audio > Speech from the initial single-reference workflow to a fully typed dual-speaker path. Both OmniVoice and Index TTS 2 now accept up to two ordered project-owned voice references with on-demand video-style audio trimming; trims are materialized through the established ffmpeg helper and temporary derivatives are safely cleaned. With fewer than two references the normal prompt remains, while two references switch to ordered Speaker 1/2 segments, enforce content for both speakers, preserve the 4096-character contract, and reset stale dialogue when a voice is removed/replaced. WanGP receives explicit prompt_enhancer T/empty and duration_seconds 0; one reference maps to A, while dialogue maps to OmniVoice AB and the managed runtime's required Index TTS 2 AB2. Additive recipe schema v2 preserves both references, trims, segments, and enhancer state while existing schema v1 Copy Settings remains compatible. Focused verification passed: 35 backend tests, 12 frontend tests, TypeScript, Pyright, renderer/Electron/preload build, and diff checks. Fresh independent review verdict: ship. Remaining environment gap: no Electron-window or live GPU model smoke.
<!-- SECTION:FINAL_SUMMARY:END -->
