---
id: AIVS-008
title: Replace curated LTX 2.3 packs with LTX 2.5
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-12 18:53'
updated_date: '2026-08-12 19:11'
labels:
  - models
  - ltx
  - wangp
dependencies: []
modified_files:
  - backend/WANGP_BACKEND.md
  - backend/handlers/health_handler.py
  - backend/ltx2_server.py
  - backend/model_profiles/profiles.py
  - backend/model_profiles/resolution_resolver.py
  - backend/wangp_model_packs.py
  - backend/tests/conftest.py
  - backend/tests/fakes/fake_wangp_bridge.py
  - backend/tests/fixtures/wangp/director/continue_video_injected.json
  - backend/tests/fixtures/wangp/director/depth.json
  - backend/tests/fixtures/wangp/director/end_image.json
  - backend/tests/fixtures/wangp/director/guide_audio.json
  - backend/tests/fixtures/wangp/director/human_motion.json
  - backend/tests/fixtures/wangp/director/ingredients.json
  - backend/tests/fixtures/wangp/director/injected_frames.json
  - backend/tests/fixtures/wangp/director/source_video_audio.json
  - backend/tests/test_director_generation.py
  - backend/tests/test_generation.py
  - backend/tests/test_model_profiles.py
  - backend/tests/test_prompt_enhancement.py
  - backend/tests/test_state_actions.py
  - backend/tests/test_wangp_bridge.py
  - backend/tests/test_wangp_model_packs.py
  - electron/python-setup.ts
  - electron/python-setup.test.ts
  - frontend/components/SettingsModal.tsx
  - frontend/components/SettingsPanel.tsx
  - frontend/lib/model-profile-availability.test.ts
  - wgp_config.json
priority: high
type: enhancement
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update AiVS's curated local WanGP LTX offering from LTX 2.3 to its superseding LTX 2.5 release while preserving compatibility with existing LTX 2.3 LoRAs, TAE previews, saved projects, and the established local model-download workflow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Product-visible LTX profiles and automatic model packs offer LTX 2.5 instead of LTX 2.3.
- [x] #2 Generation and model downloads use the current WanGP LTX 2.5 model identifiers and required files.
- [x] #3 Existing saved LTX selections continue to reopen through an explicit compatibility path.
- [x] #4 LTX 2.3 LoRAs and the existing LTX TAE preview path remain supported.
- [x] #5 Focused profile, pack, and bridge validation passes against the configured WanGP checkout.
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
1. Preserve the stable AiVS profile ID `ltx2_22b_distilled` and pack ID `ltx2_turbo` so saved Quick Gen/Copy Settings selections and pack state reopen without migration.
2. Repoint the curated Fast profile, backend pack runner, Electron catalogue, runtime defaults, health/copy, and contract fixtures from WanGP `ltx2_22B_distilled_1_1` to the 8-step `ltx2_25_22B_distilled`; update the measured automatic-pack size to ~41.3 GB.
3. Retain the existing LTX 2.3 system/user LoRA paths and TAE settings forwarding. Do not expose Dev or NVFP4 variants.
4. Validate the current WanGP model definition/manifest without downloading weights, run focused profile/pack/bridge tests and type checks, inspect the complete diff, and record the upstream TAE registry limitation separately if it prevents real 2.5 TAE decoding.

Clarify Advanced Settings preview copy so TAE is presented as conditional on WanGP support and Fast RGB fallback, matching the current LTX 2.5 registry limitation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Upstream research against WanGP dev 5cccbd2e found LTX 2.5 Dev, Distilled, and Distilled NVFP4; AiVS's existing Fast product intent maps to `ltx2_25_22B_distilled` (8 steps). Preserve stable AiVS IDs and use the INT8 manifest, measured at ~41.3 decimal GB.

Compatibility caveat: WanGP shares `loras/ltx2` across LTX versions and explicitly supports cross-version LoRAs, but individual LoRAs still undergo strict key validation. The current fork TAE registry only registers LTX 2.3 IDs/architecture, so AiVS can preserve preview forwarding/assets but LTX 2.5 TAE decoding requires a separate validated WanGP registry update; no unsafe AiVS-side override will be added.

Verification: configured WanGP branch `origin/AiVS` contains the LTX 2.5 commits/defaults. Manifest-only runtime resolution registered `ltx2_25_22B_distilled`, selected the INT8 ConvRot checkpoint, resolved 17 expected files, and retained `C:\WanGP_Models\loras\ltx2`; no weights were downloaded.

Focused backend command passed 197 tests; focused Electron/frontend command passed 5 tests. `pnpm typecheck:ts`, `pnpm typecheck:py` (0 errors), `pnpm build:frontend`, and `git diff --check` passed. Independent reviewer verdict after correction: ship.

Live GPU generation and 2.5 TAE decoding were not run. Current WanGP intentionally falls back to RGB for 2.5 because its TAE registry is limited to 2.3; UI copy now states TAE is conditional on WanGP support.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced AiVS's curated LTX 2.3 Fast runtime mapping and automatic pack with WanGP LTX 2.5 Distilled INT8 (`ltx2_25_22B_distilled`), including profile metadata, backend defaults, Electron catalogue/size, seed config, health copy, and focused generation/Director fixtures. Stable AiVS profile `ltx2_22b_distilled` and pack `ltx2_turbo` IDs remain unchanged so saved projects, Copy Settings, and model-pack state reopen without migration; the legacy LTX 2.3 type seed is retained for independent old finetunes. WanGP's shared `loras/ltx2` path preserves cross-version LoRA discovery. Preview settings remain forwarded, while Advanced Settings now accurately states TAE is conditional and RGB is the fallback because current WanGP does not register LTX 2.5 for `taeltx2_3`.

Verification: 197 focused backend tests passed; 5 focused Electron/frontend tests passed; TypeScript and Pyright passed; frontend/Electron/preload production build passed; manifest-only resolution against configured WanGP returned 17 expected LTX 2.5 files and the INT8 checkpoint; `git diff --check` passed; independent review verdict `ship`. No model weights were downloaded and no live GPU generation was run.
<!-- SECTION:FINAL_SUMMARY:END -->
