---
id: AIVS-007
title: Add TAE generation previews for LTX and MiniMax H3
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-12 15:17'
updated_date: '2026-08-12 18:43'
labels: []
dependencies: []
modified_files:
  - backend/services/wangp_bridge.py
  - backend/tests/test_wangp_bridge.py
  - frontend/views/genspace/components/GenerationPreviewMedia.tsx
  - frontend/views/genspace/components/GenerationPreviewMedia.test.tsx
  - frontend/views/genspace/GenSpaceSelectedGeneration.tsx
  - frontend/views/director/DirectorGenerationPreview.tsx
  - backend/state/app_settings.py
  - backend/_routes/settings.py
  - backend/app_handler.py
  - backend/tests/fakes/fake_wangp_bridge.py
  - backend/tests/test_settings.py
  - frontend/contexts/AppSettingsContext.tsx
  - frontend/components/SettingsModal.tsx
priority: medium
type: feature
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expose Wan2GP's new Tiny Autoencoder preview support through AiVS for the curated LTX and MiniMax H3 video workflows, preserving the existing local WanGP generation path and current behavior for unsupported models.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 LTX video generations request and display Wan2GP TAE previews through AiVS.
- [x] #2 MiniMax H3 video generations request and display Wan2GP TAE previews through AiVS.
- [x] #3 Unsupported model profiles retain their existing preview behavior and do not receive invalid TAE settings.
- [x] #4 Existing saved generation settings remain backward compatible without migration.
- [x] #5 Focused backend validation covers TAE manifest selection, animated preview delivery, and RGB fallback compatibility.
- [x] #6 When a new animated TAE preview sample replaces the previous one, playback continues from the previous normalized position instead of restarting at the beginning.
- [x] #7 Advanced Settings exposes persisted preview mode, update rate, decode device, maximum edge, playback FPS, and WebP quality controls using WanGP-supported values.
- [x] #8 Saved preview settings are applied to subsequent supported video generation manifests while unsupported models retain their existing preview behavior.
- [x] #9 Existing settings files without preview options load with the current TAE defaults and require no migration.
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
1. Trace the existing Advanced Settings form, AppSettings persistence/API types, and WanGP runtime preference handoff. 2. Add a typed nested preview settings model with backward-compatible defaults matching current AiVS TAE behavior, expose only WanGP-supported curated controls in Advanced Settings, and reuse the existing settings save/patch flow. 3. Pass persisted preview options through the existing WanGPBridge runtime preferences and supported video manifest plugin_data, leaving unsupported models untouched. 4. Add focused settings/bridge/UI contract coverage, run targeted backend/frontend tests, typechecks, production build, and independent review.

5. Reproduce the reported Save & Reload model-pack refresh crash against the configured external WanGP checkout, fix unknown curated model handling at the shared pack-path resolver, add a focused regression, then rerun model-pack/settings validation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation assumption: enable TAE automatically for supported curated video profiles. This avoids a new user setting and persistence migration; WanGP already owns capability/decoder validation and RGB fallback.

Review correction: WanGP prefers MP4 when its preview encoder is available, while both AiVS preview consumers were image-only. The plan now includes a shared media-aware renderer keyed from the cache-busted preview URL extension.

Verification: backend bridge tests 39/39 passed; GenerationPreviewMedia Vitest 2/2 passed; Python and TypeScript typechecks passed; production renderer/Electron/preload bundle passed; scoped diff check passed. Independent reviewer verdict: ship.

Runtime limitation: the real Electron app launched, but a live TAE GPU generation and Chromium codec playback could not be automated in this session. Hardware validation remains recommended before human acceptance; generated outputs are unaffected by preview playback.

Human review feedback: live TAE previews work, but each new sample restarts playback. Reopened AIVS-007 to preserve playback continuity across preview replacements, using the supplied KJ node as reference.

Continuity verification: GenerationPreviewMedia focused tests pass 4/4, including differing-duration MP4 replacement and MP4-WebP-MP4 reset; TypeScript passes; renderer/Electron/preload production build passes; scoped diff check passes. Fresh independent review verdict: ship. User live re-test remains the final runtime confirmation.

User requested preview settings/options in Advanced Settings. Reopened AIVS-007; implementation will reuse AppSettings persistence and the WanGP bridge rather than adding another preference store.

Advanced Settings now persists preview mode, update rate, decode device, maximum edge (128-1024 curated choices), playback FPS, and WebP quality as nested app settings. Existing files merge TAE/adaptive/auto/512/16/72 defaults.

Saved preview options are applied on backend startup and settings updates, then copied into `_preview` only for LTX and MiniMax H3 manifests; unsupported models keep empty plugin data.

Verification: `backend/rtk uv run pytest tests/test_settings.py -q` 22 passed; `backend/rtk uv run pytest tests/test_wangp_bridge.py -q` 40 passed; `pnpm typecheck:ts` passed; `pnpm typecheck:py` passed; `pnpm build:frontend` passed; scoped `git diff --check` passed with only existing Windows line-ending notices. Actual Electron-window settings interaction was not run in this pass.

Fresh independent review verdict: ship. No correctness findings; reviewer confirmed schema validation/defaults, nested persistence, backend startup/update forwarding, supported-model manifest gating, and frontend camelCase normalization. Residual risk is limited to live Electron/GPU combinations; no extra UI test was required.

Human review found Save & Reload fails after settings persistence because refresh-model-packs crashes while resolving curated ideogram4_int8 against a WanGP checkout that reports it as unknown. Reopened for root-cause correction.

Root cause of the Save & Reload failure was stale Ideogram runtime mappings, not preview persistence: current WanGP registers `ideogram4` and `ideogram4_turbotime`, while AiVS packs/profiles still sent the older `*_int8` IDs. Stable AiVS IDs remain unchanged for saved-setting compatibility; only WanGP-facing mappings changed.

Regression verification: model-pack tests 12/12, model-profile tests 63/63, Electron catalog tests 2/2, TypeScript and Python typechecks pass, and the exact `wangp_model_packs.py --list` command against C:\Users\rais\Documents\GitHub\Wan2GP now exits successfully and emits the full pack inventory. Scoped diff check passed with only Windows line-ending notices.

User clarified the refresh error was caused by custom finetunes not yet synced to their Wan2GP fork. Reverted all Ideogram mapping/profile/test/catalog changes from the attempted diagnosis; preview-settings implementation remains unchanged. Restored mapping contracts pass 75/75 focused backend tests and both TypeScript/Python typechecks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added automatic and configurable WanGP previews for curated LTX and MiniMax H3. AiVS preserves animated WebP/MP4 preview media, maintains normalized playback position across sample replacements, and exposes persisted Advanced Settings for preview mode, update rate, decode device, maximum edge, playback FPS, and WebP quality. Existing settings load TAE defaults without migration; unsupported models remain unchanged. Also corrected explicit settings saves to refresh canonical backend state after the status-only POST response. Verification: settings pytest 22/22, bridge pytest 40/40, preview component Vitest 4/4, Python and TypeScript typechecks, production frontend/Electron/preload build, and scoped diff checks pass. A later Ideogram mapping diagnosis was fully reverted after the user confirmed the observed refresh error came from unsynced custom finetunes in their Wan2GP fork.
<!-- SECTION:FINAL_SUMMARY:END -->
