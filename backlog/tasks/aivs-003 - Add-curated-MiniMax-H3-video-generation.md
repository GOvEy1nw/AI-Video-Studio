---
id: AIVS-003
title: Add curated MiniMax H3 video generation
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-11 14:56'
updated_date: '2026-08-12 08:27'
labels:
  - video
  - model
  - WanGP
dependencies: []
references:
  - 'https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE'
  - 'https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/README.md'
documentation:
  - >-
    C:\Users\rais\.codex\attachments\a9264d1a-d346-468b-8206-979ddb070a99\pasted-text.txt
modified_files:
  - backend/api_types.py
  - backend/handlers/model_profiles_handler.py
  - backend/handlers/video_generation_handler.py
  - backend/model_profiles/profiles.py
  - backend/model_profiles/resolution_resolver.py
  - backend/services/wangp_bridge.py
  - backend/tests/conftest.py
  - backend/tests/fakes/fake_wangp_bridge.py
  - backend/tests/test_generation.py
  - backend/tests/test_model_profiles.py
  - backend/tests/test_wangp_bridge.py
  - backend/tests/test_wangp_model_packs.py
  - backend/wangp_model_packs.py
  - electron/python-setup.ts
  - frontend/components/ModelPackManager.tsx
  - frontend/hooks/generation/request-builders.ts
  - frontend/lib/apply-generation-params.ts
  - frontend/types/model-profiles.ts
  - frontend/types/project.ts
  - frontend/views/genspace/components/GenSpaceControls.test.tsx
  - frontend/views/genspace/components/MediaInputSlot.tsx
  - frontend/views/genspace/components/PromptEditor.tsx
  - frontend/views/genspace/logic/generation-requests.test.ts
  - frontend/views/genspace/logic/generation-requests.ts
  - frontend/views/genspace/logic/media-inputs.test.ts
  - frontend/views/genspace/logic/media-inputs.ts
  - frontend/views/genspace/types.ts
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - frontend/views/genspace/video/VideoMediaInputs.tsx
priority: high
type: feature
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add MiniMax H3 as a user-friendly, local-only AiVS video model backed by the managed WanGP runtime. Support H3's FL2VA and Ref2VA capabilities through the existing curated model, generation, project-asset, and Quick Gen ownership boundaries. AiVS should choose the correct H3 variation from the user's media inputs where the choice is deterministic, expose useful media-reference capabilities without dumping raw WanGP settings, and introduce stable prompt references for selected input media.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 MiniMax H3 is available through the backend-owned curated video profile API with accurate capability, availability, download, license, and compatibility metadata supported by the managed WanGP source.
- [x] #2 Quick Gen accepts the supported H3 text, start/end frame, image reference, video reference, audio reference, and applicable control inputs with clear limits and user-facing validation.
- [x] #3 AiVS deterministically chooses H3 FL2VA or Ref2VA from the submitted media roles and maps the request to the exact WanGP model and settings without adding another inference runtime.
- [x] #4 Users can insert stable human-readable @ references to selected H3 input media in the prompt and those references compile predictably to the WanGP prompt/input ordering.
- [x] #5 H3 generation retains the shared progress, cancellation, immutable project submission, result persistence, Copy Settings, and project-isolation contracts, including video outputs with native audio.
- [x] #6 Existing curated video models and saved project/settings behavior remain compatible.
- [x] #7 Focused automated checks protect the H3 profile, request compilation, variation selection, media-reference mapping, and critical validation limits.
- [x] #8 Relevant TypeScript and Python checks pass, the production frontend build succeeds, and the H3 Quick Gen interaction is smoke-checked in Electron; any unavailable real-model GPU validation is reported explicitly.
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
1. Add one curated experimental MiniMax H3 video profile and extend the existing typed media policy only with the limits H3 needs.
2. Extend Quick Gen's existing video media inputs with stable @imageN/@videoN/@audioN aliases, preserving those aliases in saved settings and rejecting dangling prompt references.
3. Compile prompt aliases at the backend boundary and route requests deterministically: reference image/video/audio selects minimax_h3_ref2va_pruned; otherwise text, start/end frames, control video, or soundtrack selects minimax_h3_fl2va_pruned; reject incompatible mixed roles.
4. Extend WanGPBridge and the model-pack resolver minimally for H3's list-valued references and combined FL2VA/Ref2VA automatic download pack, without changing the managed Wan2GP checkout.
5. Surface H3's license metadata in the curated profile and downloader; automatic downloads are enabled under the user's confirmed distribution scope. Do not expose raw WanGP controls or hosted 2K generation.
6. Add focused routing, alias-compilation, profile-serialization, and pack-resolution checks; run targeted backend/frontend checks, TypeScript/Python typechecks, frontend build, and an Electron smoke test.

7. Recompose H3 media inputs into mutually exclusive start/end frame slots plus an Add media reference surface that accepts images, videos, and audio while reusing the existing project-asset and trim flows.

8. Replace H3 prompt alias chips with an accessible @ mention menu that can add media or insert an existing stable alias at the current prompt selection, then verify focused interaction logic, strict TypeScript, frontend build, and the real Electron UI.

9. Make H3 frame slots square and replace the per-kind Add media icon buttons with one full-surface combined importer while retaining per-kind limits after file-type detection.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Upstream review found no competing AiVS implementation. WanGP already supports minimax_h3_fl2va_pruned and minimax_h3_ref2va_pruned with local 24 fps generation and native audio.

License gate: MiniMax H3's official community license excludes the UK, EU, US, and Republic of Korea from its automatic territory grant, and the DeepBeepMeep pruned checkpoints do not state a separate permissive license. Recommended scope is full support for already-installed weights with automatic AiVS download disabled pending reviewed distribution rights.

User explicitly selected automatic H3 downloads on 2026-08-11 after the territorial license limitation was presented. Implementation may expose the combined H3 FL2VA/Ref2VA pack through the existing downloader and must retain visible license metadata.

Actual Electron/model-manager smoke on 2026-08-11 reached the H3 automatic download path but failed before downloading: `TypeError: download_models() got an unexpected keyword argument 'progress_callback'` from backend/wangp_model_packs.py `_download_model_dependencies`. Fix and a no-weight regression check are required before finalization.

Downloader regression fixed after Electron smoke: `_download_model_dependencies` now mirrors the current managed WanGP `download_models()` signature and does not pass the unsupported callback; progress forwarding remains on the supported `process_files_def` path. Evidence: `rtk uv run pytest tests/test_wangp_model_packs.py -q` -> 12 passed; `rtk pnpm typecheck:py` -> 0 errors/0 warnings. A real retry/download remains user-controlled because the combined pack is approximately 206.8 GB.

Live installation evidence: the user completed the combined H3 download through the actual AiVS Electron model manager after the callback fix. `C:\Users\rais\AppData\Local\AiVS\model-pack-state.json` records 10 files for `minimax-h3`; a read-only check found 0 missing files.

Final independent reviewer verdict: ship, no findings. Residual validation limit: no H3 GPU inference/output-quality/native-audio generation was run.

Live GPU validation completed: the user confirmed a real MiniMax H3 generation ran successfully through AiVS with the downloaded combined pack.

Human-review follow-up requested: match the supplied H3 reference layout, disable Add media when start/end frames are used, disable start/end frames when reference media exists, and replace permanent prompt chips with an @-triggered add/insert menu.

Human-review follow-up: make the H3 Start/End image slots square and make the entire Add media surface one combined image/video/audio file-import button.

H3 UI follow-up complete: square Start/End slots; one full-width Add media button opens a combined image/video/audio input; @ commands retain type-specific pickers; restored unknown roles remain removable; concurrent async imports validate and allocate aliases against current state.

Validation: focused H3 UI/media tests 19/19 passed; strict TypeScript passed; production renderer/Electron-main/preload build passed; scoped diff check had no whitespace errors; actual Electron screenshot confirmed square frame slots and the full-width Add media surface; independent final reviewer verdict ship.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented MiniMax H3 as one curated experimental AiVS video profile backed exclusively by local WanGP, including automatic combined-pack download, deterministic FL2VA/Ref2VA routing, stable prompt aliases, validation, Copy Settings, and real GPU generation. The final Quick Gen H3 References UI uses square Start/End image slots, one full-width Add media button with a combined image/video/audio importer, removable reference cards, mutual exclusion with FL2VA media, and an accessible @ menu for add commands and existing aliases. Restored unsupported roles remain visible/removable, and concurrent imports allocate aliases against current state. Verification: related backend suites passed (final generation/bridge 83 and pack 12), focused frontend suites passed (final UI/media 19), TypeScript and Python typechecks passed, production renderer/Electron-main/preload build passed, Electron visual smoke confirmed the final layout and @ menu, full H3 pack download and a real H3 GPU generation succeeded, and the independent final reviewer returned ship with no findings.
<!-- SECTION:FINAL_SUMMARY:END -->
