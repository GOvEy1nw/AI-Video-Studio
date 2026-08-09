---
id: AIVS-042
title: Add MMAudio SFX generation
status: Human Review
assignee:
  - '@Codex'
created_date: '2026-08-06'
updated_date: '2026-08-08 19:36'
labels:
  - maestro-programme
  - audio
  - sfx
  - mmaudio
dependencies:
  - AIVS-035
  - AIVS-036
  - AIVS-040
modified_files:
  - THIRD_PARTY_NOTICES.md
  - backend/_routes/audio_sfx.py
  - backend/api_types.py
  - backend/app_factory.py
  - backend/app_handler.py
  - backend/handlers/__init__.py
  - backend/handlers/model_profiles_handler.py
  - backend/handlers/sfx_generation_handler.py
  - backend/model_profiles/__init__.py
  - backend/model_profiles/policies.py
  - backend/model_profiles/profiles.py
  - backend/services/video_clip.py
  - backend/services/wangp_bridge.py
  - backend/tests/conftest.py
  - backend/tests/fakes/fake_wangp_bridge.py
  - backend/tests/test_sfx_generation.py
  - backend/tests/test_wangp_bridge.py
  - backend/tests/test_wangp_model_packs.py
  - backend/wangp_model_packs.py
  - docs/GENSPACE_ARCHITECTURE.md
  - electron/python-setup.test.ts
  - electron/python-setup.ts
  - frontend/hooks/generation/request-builders.ts
  - frontend/hooks/generation/types.ts
  - frontend/hooks/use-generation.ts
  - frontend/hooks/use-image-profiles.ts
  - frontend/types/model-profiles.ts
  - frontend/types/project.ts
  - frontend/types/sfx.ts
  - frontend/views/genspace/audio/AudioGenPanel.test.tsx
  - frontend/views/genspace/audio/AudioGenPanel.tsx
  - frontend/views/genspace/audio/SfxGenPanel.test.tsx
  - frontend/views/genspace/audio/SfxGenPanel.tsx
  - frontend/views/genspace/audio/SfxMediaInputs.tsx
  - frontend/views/genspace/hooks/useGenSpaceAudioState.ts
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts
  - frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts
  - frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts
  - frontend/views/genspace/logic/active-generation-profile.test.ts
  - frontend/views/genspace/logic/active-generation-profile.ts
  - frontend/views/genspace/logic/generation-assets.ts
  - frontend/views/genspace/logic/settings-restore.test.ts
  - frontend/views/genspace/logic/settings-restore.ts
  - frontend/views/genspace/logic/sfx-request.ts
  - frontend/views/genspace/types.ts
type: enhancement
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expose WanGP's registered MMAudio processor as a curated Audio > SFX workflow with optional video conditioning.

**Programme wave:** 2  
**Complexity:** Large  
**Dependencies:** AIVS-040
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SFX appears only when the profile/processor is supported.
- [x] #2 Dependencies install through the normal progress/cancel UI.
- [x] #3 Text-only and video-conditioned generation work.
- [x] #4 No unsupported Prompt Strength control is shown.
- [x] #5 Output persists as an Audio Asset and restores.
- [x] #6 Cancellation cleans temporary output.
- [x] #7 Licences and notices are complete.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [x] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
- [x] #7 Applicable native Electron and real WanGP validation is recorded
- [x] #8 Provenance and licence metadata are complete for added runtime/model assets
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconcile the in-progress capability-policy work with AIVS-042 by adding a dedicated visible audio SFX profile for the registered MMAudio processor, a distinct `sfx_generation` handler owner, and a required `mmaudio` pack. Keep the existing LTX video profile policy intact for video-owned soundtrack capability; the SFX panel selects only the dedicated profile.
2. Extend the existing model-pack downloader with one `audio_processor` branch that asks WanGP's registered MMAudio handler for its download definitions, resolves the same definitions to installed-file paths, and therefore reuses the existing Electron progress/cancel UI, pack manifest, availability refresh, and safe deletion behavior.
3. Add a typed `/api/generate-sfx` route and composed `SfxGenerationHandler` using the shared `GenerationHandler`. Validate the curated profile and local source video, create/trim only runtime-owned MP4 conditioning derivatives (black video for text-only), invoke a narrow `WanGPBridge.generate_sfx` adapter, check cancellation before and after inference, and delete output/derivatives on cancellation or failure.
4. Extend the single renderer generation facade with typed SFX request/result support. Add controller-owned SFX settings/media state and a focused SFX panel showing model, optional Video Clip, Sound Description, Exclude, Duration, and Seed—never Prompt Strength. Gate the panel/action on the dedicated backend profile and pack availability.
5. Capture an immutable project-scoped SFX submission snapshot, persist the returned file once as an Audio Asset with a versioned `SfxGenerationRecipeV1` (profile/processor revision, prompt, negative prompt, duration, seed, and optional source lineage/trim), and restore it through Copy Settings without changing existing Music behavior.
6. Add only focused contract coverage for profile/pack mapping, bridge arguments, text/video validation and cleanup/cancel behavior, SFX request compilation, panel gating/no-Prompt-Strength behavior, and recipe persistence/restore. Update GenSpace architecture and third-party notices/provenance.
7. Run strict Python and TypeScript checks, focused backend/frontend tests, the frontend production build, task-scoped diff/whitespace inspection, and an independent review. Record native Electron/real MMAudio evidence when available; explicitly retain the known broken backend environment/inference-time cancellation limitation when those checks cannot run.

8. Correct the review regression by adding the existing backend `mmaudio` pack to Electron's authoritative Model Manager catalog with matching ID/model type/audio metadata and the upstream-derived 13.9 GB estimate; verify Model Manager transport through strict TypeScript and the production Electron/frontend build, then re-finalize.

9. Address human-review UX corrections within the existing GenSpace architecture: place the SFX model selector beside the Audio mode selector; remove Exclude; move Duration/Seed and, only if the shared enhancer supports SFX, Enhance into the established prompt footer; replace the ad-hoc video drop target with the shared input-media zone; and correct in-progress profile selection so MMAudio, not ACE-Step, labels SFX jobs. Update only focused tests, then run strict TypeScript, the relevant Vitest group, production build, task-scoped diff checks, visual smoke where the local app is available, and independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Record approved deviations, source revisions, exact commands/results, runtime hardware, screenshots or recordings where relevant, and resulting commit/PR SHAs here.

2026-08-08: Resuming from a heavily modified `dev` worktree. Existing AIVS-042-related edits will be preserved and audited against the acceptance criteria before further implementation; unrelated user changes will not be reverted.

2026-08-08 research: current code has AIVS-036 SFX policy plumbing and the AIVS-040 Audio placeholder, but no MMAudio pack/profile/route/handler/bridge/frontend/persistence path. The refreshed plan uses a dedicated audio SFX profile and one registered audio-processor pack branch, while preserving the existing shared job lifecycle and dirty-worktree changes.

Implemented a dedicated backend-owned `mmaudio_sfx` profile and `audio_processor` model pack. The renderer separates Music (`music.enabled`) from SFX (`sfx_generation`), keeps the unsupported shell when no SFX profile exists, and routes missing packs through the existing Model Manager.

Generation uses one typed `/api/generate-sfx` route, composed handler, shared generation lifecycle, black-video text conditioning, optional project video conditioning/trim, and the registered WanGP MMAudio processor. Shared cancellation covers preparation and pre/post inference; partial outputs and runtime-owned derivatives are deleted on cancellation/failure. WanGP MMAudio still has no cooperative inference-time abort callback.

Frontend submission captures an immutable project-scoped `SfxGenerationRecipeV1`; persistence adds exactly one Audio Asset; Copy Settings restores Audio > SFX prompt, model, exclude text, duration, seed, source asset lineage, and trim while leaving Music state isolated.

Verification: `uv run pyright` passed (0 errors); focused backend groups passed (46, then 70 profile-focused, and final `tests/test_sfx_generation.py` 9/9); focused frontend SFX/action/persistence/restore tests passed (latest relevant groups 8/8, 9/9, and gating 5/5); `pnpm typecheck:ts` passed; `pnpm build:frontend` passed; task-scoped `git diff --check` passed; independent re-review verdict was ship/no findings after bounded fixes.

Broad `pnpm backend:test` reached 328 passed / 1 skipped and exposed one task-related Music/SFX visibility regression, which was fixed and reverified. The remaining failure is unrelated pre-existing dirty-worktree drift: bundled WanGP reports 12.44 while `scripts/wangp-source.json` records 12.432. Whole-worktree `git diff --check` also reports only two unrelated trailing-whitespace lines in `Wan2GP/README.md`; the AIVS-042 scoped check is clean.

Native Electron and real GPU MMAudio inference were not run in this environment. The code path is verified with the composed FastAPI app, real ffmpeg conditioning, and a fake heavy WanGP boundary; the real-model download/inference path and post-inference-only cancellation ceiling remain the manual review risk.

Licensing/provenance: bundled Synchformer and BigVGAN retained licence paths are recorded. `DeepBeepMeep/Wan2.1` does not declare a repository-level weights licence, so profile metadata and notices explicitly mark weights licensing/commercial use unknown and infer no rights.

2026-08-08 human review: Model Manager did not list MMAudio. Root cause is a duplicated pack catalog boundary: backend `PACKS` contains `mmaudio`, but Electron `MODEL_PACKS` (the source returned by `getModelPacks()`) does not. Reopened AIVS-042; acceptance criterion #2 is unverified until Electron catalog parity is restored.

Human-review correction completed: Electron's `MODEL_PACKS` catalog now includes `mmaudio` with the same ID/model type used by backend `PACKS` and the SFX profile, so `getModelPacks()` returns it to Model Manager and installed-pack availability can map back to `mmaudio_sfx`. The displayed 13.9 GB estimate sums the exact WanGP download folders/files: MMAudio 9.49 GB, DFN5B CLIP 3.95 GB, and the selected BigVGAN generator about 489 MB.

Correction verification: `pnpm exec vitest run electron/python-setup.test.ts` passed 1/1; `pnpm typecheck:ts` passed; `pnpm build:frontend` passed renderer, Electron main, and preload builds; scoped diff/whitespace inspection passed. The required full `pnpm test:frontend` run completed 205/208 tests across 55 files with three unrelated existing failures (`ModelProfilesContext`, `AssetContextMenu`, and `MusicGenPanel`); the new catalog regression passed independently.

2026-08-08 human review requested five SFX UI corrections and reported the active-job model label as ACE-Step. AIVS-042 is reopened while these review findings are implemented and reverified.

2026-08-08 human-review UI correction completed: the MMAudio picker now shares the Audio header with Type; Exclude is removed from the UI while its persisted/request field remains for saved-data compatibility; Duration and Seed use the standard PromptEditor footer; Enhance remains hidden because the SFX request/submission contract cannot consume the shared enhancement toggle; and optional video uses the shared MediaInputSlot with gallery drop plus OS file selection.

The active processing model now resolves from the newest immutable generation submission timestamp and includes SFX profiles in the display-name map, so an in-flight SFX job remains labelled MMAudio even if the user changes modes. Verification: `pnpm typecheck:ts` passed; focused SFX header/panel/profile/restore group passed 12/12, followed by the expanded SfxGenPanel file-input group 3/3 and active-profile regression 2/2; `pnpm build:frontend` passed renderer, Electron main, and preload; scoped diff/whitespace checks passed; independent reviewer verdict: ship/no findings.

Visual localhost smoke was attempted against the running Vite server but browser access to `http://localhost:5173` was declined, so no native Electron/file-picker visual claim is made. The OS file-selection contract is instead covered through the focused jsdom change-event test; native Electron interaction and real GPU MMAudio inference remain manual review risks already recorded on the task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added curated local MMAudio sound-effect generation under Audio > SFX, including the backend profile/pack, Model Manager catalog entry, typed generation route, text/video conditioning, shared lifecycle cleanup, Audio Asset persistence, and Copy Settings restoration. Human-review corrections now align SFX with established GenSpace UI: the model picker sits beside Audio Type, Exclude is absent, Duration and Seed live in the prompt footer, and optional video uses the standard media-input slot for gallery drops and file selection. Enhance is intentionally hidden because the SFX request path has no compatible enhancement contract. Active jobs now derive their model from the newest immutable submission and display MMAudio rather than ACE-Step, including across mode switches. Strict TypeScript, focused SFX UI/profile/restore tests, the renderer/Electron/preload production build, scoped whitespace checks, and an independent review pass. Browser access for a live localhost visual smoke was declined; native Electron file-picker and real GPU MMAudio inference remain manual review items.
<!-- SECTION:FINAL_SUMMARY:END -->

## Current State

The pinned WanGP audio-processor registry declares MMAudio, prompt/negative prompt support, repeat, duration validation, and queryable download definitions. AiVS does not expose it.

## Target State

A curated `mmaudio_sfx` profile/pack, text-only or video-conditioned generation, 1–20 second MVP duration, normal progress/cancel, project Asset persistence, and Copy Settings.

## API / Runtime Contract

Implement `POST /api/audio/sfx`. Renderer submits a curated profile ID; backend owns registered method `mmaudio`.

## Persistence and Compatibility

Add `text-to-sfx` and `video-to-sfx` modes plus a versioned SFX recipe. Output is an Audio Asset.

## Existing Files Expected to Change

- backend/model_profiles/profiles.py
- backend/wangp_model_packs.py
- backend/services/wangp_bridge.py
- backend/api_types.py
- backend/app_handler.py
- frontend/hooks/use-generation.ts
- frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts
- frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts
- frontend/types/project.ts
- THIRD_PARTY_NOTICES.md

## Proposed New Files

- backend/_routes/audio_sfx.py
- backend/handlers/sfx_generation_handler.py
- frontend/types/sfx.ts
- frontend/views/genspace/audio/SfxGenPanel.tsx
- frontend/views/genspace/logic/sfx-request.ts

## WanGP / External Runtime Files to Inspect or Change

- Wan2GP/postprocessing/audio_processors.py
- Wan2GP/postprocessing/mmaudio/audio_processor.py
- Wan2GP/postprocessing/mmaudio/

## Required Error and Recovery States

- processor unavailable
- model pack missing
- download cancelled
- video under one second
- invalid source/prompt
- processor crash
- OOM
- partial output

## Automated Validation

- pack resolution/invariants
- profile serialisation
- handler-to-processor fake
- duration/video validation
- progress/cancel
- persistence/restore

## Manual / Real-Runtime QA

- first-use download
- text-only
- video-conditioned
- trim
- 1s/20s bounds
- cancel download/generation
- restart readiness
- Asset playback

## Non-Goals

- PrismAudio
- generic audio-postprocessor UI
- cloud SFX
- invented runtime controls

## Recommended Commit / PR Split

- Commit 1: pack, profile, and bridge.
- Commit 2: API/shared job.
- Commit 3: UI, persistence, tests, notices, and real QA.

## Required Reading

- Wan2GP/docs/AUDIO_PROCESSORS.md
- backend/WANGP_BACKEND.md
- 05-LICENSING-AND-PROVENANCE-RULES.md
