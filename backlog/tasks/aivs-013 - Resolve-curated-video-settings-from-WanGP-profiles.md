---
id: AIVS-013
title: Resolve curated video settings from WanGP profiles
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-16 11:53'
updated_date: '2026-08-16 16:34'
labels: []
dependencies:
  - AIVS-010
modified_files:
  - backend/model_profiles/types.py
  - backend/model_profiles/video_profiles.py
  - backend/model_profiles/profiles.py
  - backend/handlers/video_generation_handler.py
  - backend/handlers/director_generation_handler.py
  - backend/services/wangp_bridge.py
  - backend/wangp_model_packs.py
  - backend/tests/fakes/fake_wangp_bridge.py
  - backend/tests/test_generation.py
  - backend/tests/test_director_generation.py
  - backend/tests/test_model_profiles.py
  - backend/tests/test_prompt_enhancement.py
  - backend/tests/test_wangp_bridge.py
  - backend/tests/test_wangp_model_packs.py
  - electron/python-setup.ts
  - electron/python-setup.test.ts
priority: high
type: enhancement
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use WanGP's new stable profile-resolution API as the source of effective generation settings for curated AiVS video variants, so supported video profiles track upstream defaults and accelerator or preset updates without copying their full settings into AiVS. Preserve AiVS-owned product policy, dynamic request data, local-only generation, and clear failure behavior when the configured upstream profile is unavailable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Curated video variants can reference stable WanGP accelerator and preset profile IDs and receive their effective upstream settings at generation time.
- [x] #2 AiVS-owned per-variant overrides and per-request prompt, media, resolution, duration, frame-rate, seed, and mode-routing values take precedence over resolved upstream settings.
- [x] #3 Video variants without configured upstream profile IDs continue using their existing curated settings.
- [x] #4 Model-pack dependency resolution uses the same effective upstream profile settings so required LoRAs and configuration dependencies remain synchronized with generation.
- [x] #5 A missing, invalid, or incompatible configured WanGP profile fails clearly without silently using unrelated settings.
- [x] #6 Focused backend tests cover upstream resolution, override precedence, dependency synchronization, and failure behavior; relevant Python type checking passes.
- [x] #7 Curated video generation resolves WanGP model defaults even when no accelerator or preset profile is configured, then applies AiVS-owned profile and request overrides.
- [x] #8 Video model-pack dependency resolution starts from the same WanGP model defaults before applying accelerator, preset, and explicit pack overlays.
- [x] #9 MiniMax H3 Fast resolves the WanGP AIVS accelerator profile compatible with the active FL2VA or Ref2VA model type for both generation and model-pack dependencies.
- [x] #10 MiniMax H3 compact config and Fast acceleration settings/LoRAs come from WanGP settings and accelerator profiles rather than AiVS-local injection.
- [x] #11 LTX 2.5 Fast generation, processing operations, and model-pack dependencies use WanGP's fully distilled `ltx2_25_22B_distilled` checkpoint without applying the Dev-checkpoint distilled accelerator/LoRA, while LTX 2.5 Quality remains on `ltx2_25_22B` plus its HQ accelerator and distilled LoRA.
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
1. Keep WanGP effective-settings resolution behind WanGPBridge: configured accelerator/preset IDs use `resolve_profiles`; ID-less curated video profiles use `get_default_settings`.
2. Keep stable AiVS product IDs, but route `ltx2_25_fast` to WanGP `ltx2_25_22B_distilled` with no accelerator profile; explicitly route `ltx2_25_quality` to `ltx2_25_22B` with the HQ Res2S accelerator/distilled LoRA.
3. Apply the same split to model-pack dependency discovery and the Electron model catalogue so Fast downloads/checks the full distilled checkpoint and Quality downloads/checks Dev plus its resolved LoRA. Preserve unrelated MiniMax Music 3 work already present in overlapping files.
4. Retain the existing shared video handler path so generation, Director, styles, and processing operations automatically use the selected profile model type; do not add operation-specific model overrides.
5. Update the nearest backend fake and focused profile/generation/pack/Electron assertions for the checkpoint split, then run focused tests, Python and TypeScript type checks where affected, scoped diff inspection, and independent review. Do not download model weights or run GPU generation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Confirmed against the local Wan2GP dev checkout: `WanGPSession.resolve_profiles(model_type, accelerator_profile_id=..., preset_profile_id=...)` returns defaults merged with accelerator then preset. LTX Fast ID is `ltx2_25_two_stage_distilled_8_3`; Quality ID is `ltx2_25_two_stage_hq_res2s_15_3`. Current H3 accelerator profiles do not match AiVS's required Kijai FL2VA/Ref2VA routing, so H3 remains on existing local overrides.

The worktree already contains uncommitted AIVS-012 Styles Library changes in ModelProfile, video profiles, video generation, bridge, fake, and tests. AIVS-013 must preserve those changes and update their LoRA-composition expectations to include the newly resolved upstream LTX distilled LoRA.

Implemented backend-only accelerator/preset IDs. LTX Fast and Quality now resolve WanGP's stable two-stage accelerator profiles; MiniMax H3 remains on its existing AiVS-owned FL2VA/Ref2VA settings because upstream profiles do not match that routing.

Quick Gen and Director merge resolved upstream settings before AiVS profile, output, mode, style, and dynamic request values. Numeric upstream force_fps cannot replace the request; existing auto/control sentinel behavior is preserved.

Model packs resolve the same profile IDs through one WanGPSession, derive config and LoRA dependencies from the result, preserve explicit pack overlays, and use userData/wangp_bridge/wgp_config.json.

Verification: focused backend run produced 194 passed and one known unrelated #0076 Director exact-manifest assertion failure; pnpm typecheck:py passed with 0 errors; the added dynamic precedence regression passed 1/1; scoped git diff --check passed with only existing CRLF conversion warnings. Independent reviewer verdict: ship, no findings. No GPU generation was run; user will perform live testing.

Human review reopened at the user's request to add WanGP model-default resolution before live testing.

Wan2GP Dev evidence: get_default_settings validates the model, returns a deep-copied defaults mapping, and resolve_profiles starts from those defaults before accelerator then preset. H3 native handler defaults already provide 20 steps, flow_shift 12 and Euler; current H3 defaults do not select gguf_q4_k_m,fp8mix or the Kijai Fast LoRAs, so those remain AiVS-owned.

Model-default extension implemented: WanGPBridge dispatches to resolve_profiles when IDs exist and get_default_settings otherwise, with explicit API/result validation and isolated returned settings.

H3 Quality now inherits WanGP's native sampling defaults and keeps only the AiVS compact config override. H3 Fast layers its existing six-step, flow-shift, multiplier and mode-specific LoRAs after upstream defaults. Quick Gen selects effective steps only after the AiVS profile overlay.

Pack default/profile resolution is restricted to ltx2_fast, ltx2_quality, minimax-h3-fast and minimax-h3-quality. Other image/audio packs do not call the new defaults path; explicit pack config and LoRAs remain last.

Verification after the extension: focused backend suite passed 196 tests with the unrelated #0076 assertion deselected; pnpm typecheck:py passed with 0 errors; primary reran four critical default/H3/pack tests and all passed; scoped git diff --check passed with only CRLF conversion warnings. Fresh independent reviewer verdict: ship, no findings. No GPU generation or model download was run.

Human review reopened after the user added dedicated AIVS-prefixed H3 FL2VA and Ref2VA accelerator profiles plus compact config defaults in Wan2GP Dev. AiVS will now remove the remaining local H3 config/acceleration injection and route Fast by active H3 model type.

Verified exact Wan2GP Dev IDs: FL2VA `AIVS_h3_turbo_lightx2v_fl2v_4_steps_v0.1`; Ref2VA `AIVS_h3_turbo_lightx2v_ref2v_4_steps_v0.1`. The corresponding profiles supply their mode-specific Kijai LoRA, multiplier 0.5, 6 steps, and guidance 1. Both `minimax_h3_fl2va_pruned_settings.json` and `minimax_h3_ref2va_pruned_settings.json` now supply `config=gguf_q4_k_m,fp8mix`.

Final H3 refinement implemented: ModelProfile now supports a backend-only per-model-type accelerator map with scalar fallback. Quick Gen and Director use the shared selector. H3 Fast maps exact AIVS FL2VA/Ref2VA IDs; H3 Quality has no local settings or accelerator. H3 packs use the same mapping/default behavior and no longer contain local config or LoRA URLs.

Verification: implementer ran `uv run pytest tests/test_model_profiles.py tests/test_generation.py tests/test_director_generation.py tests/test_wangp_model_packs.py -q` (153 passed) and `pnpm typecheck:py` (0 errors). Primary reran five critical H3 profile/generation/pack tests successfully and scoped `git diff --check` exited 0 with only CRLF warnings. Fresh independent review found no defects and additionally passed six focused H3 tests. No GPU generation or real model-pack download was run; user runtime validation remains.

Runtime validation exposed the exact upstream contract failure: WanGP `shared/api.py` validates explicit profile IDs with `[a-z0-9][a-z0-9._-]*`, so both `AIVS_h3_...` IDs are rejected before lookup. AiVS will use lowercase `aivs_h3_...`; the two external Wan2GP JSON `profile_id` values must be changed to match.

Lowercase-ID correction completed after user updated the external Wan2GP JSONs. AiVS profile metadata, pack mappings, fake resolver, and focused assertions now use `aivs_h3_turbo_lightx2v_fl2v_4_steps_v0.1` and `aivs_h3_turbo_lightx2v_ref2v_4_steps_v0.1`.

Live API-level verification used the AiVS backend environment against the user's Wan2GP Dev checkout: `WanGPSession.resolve_profiles` succeeded for both pruned H3 model types and returned six steps. Five focused AiVS H3 generation/profile/pack tests passed; stale uppercase-ID search returned zero; scoped diff check exited 0 with only CRLF warnings. A first focused test command used a wrong pytest class node and collected no tests; the corrected command passed.

Human review reopened at the user's request: LTX Fast should use the recommended fully distilled checkpoint for generation and processing workflows; LTX Quality should retain the Dev checkpoint plus HQ accelerator/distilled LoRA. Stable AiVS Fast/Quality product and pack IDs remain unchanged.

Wan2GP Dev verification: `get_default_settings('ltx2_25_22B_distilled')` returns eight steps and no activated LoRA; its model definition architecture is `ltx2_25_22B`. `resolve_profiles('ltx2_25_22B', accelerator_profile_id='ltx2_25_two_stage_hq_res2s_15_3')` returns Res2S, 15 steps, and the distilled LoRA at multiplier `0.5|`. Existing AiVS processing requests use `profile.wangp_model_type`, so the curated Fast mapping is the single routing boundary.

Final LTX checkpoint split: stable AiVS Fast/Quality IDs remain unchanged. Fast now maps to WanGP `ltx2_25_22B_distilled` with no accelerator or distilled-LoRA overlay; Quality explicitly maps to Dev `ltx2_25_22B` plus `ltx2_25_two_stage_hq_res2s_15_3`, whose resolved distilled LoRA multiplier is `0.5|`. The shared profile model type carries the Fast checkpoint through Quick Gen, Director, prompt enhancement, Styles, and curated processing tools without operation-specific branches. Model-pack resolution and the Electron catalogue use the same split. Unrelated AIVS-014 MiniMax Music 3 edits in overlapping pack/catalogue files were preserved.

Final verification: focused backend profile/generation/Director/pack suite passed 153 tests; Electron `python-setup.test.ts` passed 4 tests; primary critical routing rerun passed 7 tests; prompt-enhancement regression passed 2 tests after correcting its stale expectation; `pnpm typecheck:py` passed with 0 errors and `pnpm typecheck:ts` exited 0; scoped `git diff --check` exited 0 with only CRLF conversion warnings. Independent re-review verdict: ship, no findings. No GPU generation, live LoRA execution, or model download was run; runtime validation remains for human testing.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

- Video generation and model-pack settings now resolve WanGP model defaults and stable accelerator/preset profiles, keeping upstream sampling, config, and dependency data authoritative while AiVS request values remain last.
- MiniMax H3 Fast selects the matching lowercase AIVS FL2VA/Ref2VA accelerator; H3 Quality uses upstream defaults. Compact config and Fast LoRAs are no longer injected locally.
- LTX 2.5 Fast now uses the full `ltx2_25_22B_distilled` checkpoint with no Dev distilled-LoRA overlay. LTX 2.5 Quality remains on `ltx2_25_22B` with the HQ Res2S accelerator and its upstream distilled LoRA.
- Quick Gen, Director, prompt enhancement, Styles, processing tools, model packs, and the Electron catalogue follow the same curated checkpoint mapping.

## Verification

- Backend focused suite: 153 passed.
- Primary critical routing selection: 7 passed.
- Prompt enhancement: 2 passed.
- Electron model catalogue: 4 passed.
- `pnpm typecheck:py`: 0 errors.
- `pnpm typecheck:ts`: passed.
- Scoped `git diff --check`: passed; CRLF conversion warnings only.
- Independent final review: ship, no findings.

No GPU generation or model download was performed; live Wan2GP runtime validation remains for human review.
<!-- SECTION:FINAL_SUMMARY:END -->
