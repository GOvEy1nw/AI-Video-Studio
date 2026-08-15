---
id: AIVS-010
title: Add Base and Turbo variants for MiniMax H3 and LTX 2.5
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-13 13:06'
updated_date: '2026-08-14 11:01'
labels: []
dependencies:
  - AIVS-003
  - AIVS-008
modified_files:
  - backend/model_profiles/profiles.py
  - backend/model_profiles/resolution_resolver.py
  - backend/handlers/video_generation_handler.py
  - backend/wangp_model_packs.py
  - backend/tests/test_model_profiles.py
  - backend/tests/test_generation.py
  - backend/tests/test_wangp_model_packs.py
  - electron/python-setup.ts
  - electron/python-setup.test.ts
priority: high
type: enhancement
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expose curated Base and Turbo generation variants for MiniMax H3 FL2VA/Ref2VA and LTX 2.5 while preserving stable AiVS compatibility boundaries. MiniMax H3 variants share the pruned FL2VA/Ref2VA models and compact gguf_q4_k_m/fp8mix config, with Turbo activating the specified 4-step Light2XV LoRA. LTX 2.5 variants both use the ltx2_25_22B base checkpoint, with Turbo applying the distilled LoRA rather than selecting the fully distilled checkpoint. Automatic model packs must offer matching Base and Turbo choices and download only their required variant assets.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 MiniMax H3 Base and Turbo are selectable curated video variants for both FL2VA and Ref2VA input paths, using the requested model IDs and exact Base/Turbo generation defaults.
- [x] #2 MiniMax H3 Turbo selects https://huggingface.co/Kijai/MiniMax-H3_comfy/resolve/main/loras/minimax_h3_fl2v_lightx2v_turbo_4step_v0.1_comfy_resized_avg_rank_21_bf16.safetensors for FL2VA and https://huggingface.co/Kijai/MiniMax-H3_comfy/resolve/main/loras/minimax_h3_ref2v_lightx2v_turbo_4step_v0.1_resized_avg_rank_20_bf16.safetensors for Ref2VA, each at multiplier 1.0|; Base activates neither.
- [x] #3 The MiniMax H3 Turbo automatic model pack downloads both mode-specific Turbo LoRAs while Base downloads neither, and both packs retain the compact gguf_q4_k_m text encoder and fp8mix video VAE configuration.
- [x] #4 LTX 2.5 Base and Turbo are selectable curated variants that both route generation through ltx2_25_22B and use the requested exact Base/Turbo generation defaults.
- [x] #5 LTX 2.5 Turbo retains sample_solver=distilled_8_steps so WanGP auto-applies its registered distilled LoRA at the native 0.5 strength instead of selecting ltx2_25_22B_distilled; Base does not activate that LoRA.
- [x] #6 LTX 2.5 automatic model packs expose Base and Turbo choices matching their generation dependencies without forcing saved-state migration.
- [x] #7 Focused profile, generation-manifest, model-pack, and visible pack-catalogue checks pass, with the production frontend bundle/type boundaries checked where affected.
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
1. Replace the single H3 Turbo LoRA constant with FL2VA and Ref2VA constants, and include both files in the existing Turbo model pack.
2. Keep the FL2VA LoRA as the profile default, then replace only `activated_loras` with the Ref2VA LoRA after the existing request validation resolves Ref2VA; both use `1.0|`.
3. Extend the focused generation and pack assertions to prove each H3 mode receives only its matching LoRA and the Turbo pack contains both.
4. Run the focused backend tests and Python typecheck, inspect the scoped diff, and return AIVS-010 to Human Review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research confirmed WanGP accepts H3 `gguf_q4_k_m,fp8mix` as positional system config IDs, auto-applies the LTX 2.5 distilled system LoRA for the base `ltx2_25_22B` model when `sample_solver=distilled_8_steps`, and exposes the exact LTX LoRA URL through its handler metadata. The user's requested pruned H3 IDs and Ref2VA Turbo behavior remain authoritative even though upstream's named Light2XV profile is FL2V-specific.

Implemented four curated video variants with exact requested settings. H3 Base/Turbo share compact Q4 text encoder and FP8-mixed VAE config; Turbo activates the exact Light2XV URL. LTX Base/Turbo both use `ltx2_25_22B`; WanGP activates its registered distilled system LoRA from the Turbo `distilled_8_steps` solver.

Model packs now apply selected WanGP configs and LoRA requirements to the same effective model definition for download and installed-manifest resolution. Existing pack/profile IDs retain saved-state meaning.

Independent review found and verified a lifecycle correction: incompatible H3 multi-shot/video-tool requests are rejected before job creation, including `extend`, and a recovery request succeeds. Final reviewer verdict: ship.

Verification: backend focused pytest 133 passed; Pyright 0 errors; TypeScript typecheck passed; electron/python-setup Vitest 3 passed; production renderer/Electron/preload build passed; scoped git diff --check passed. Live GPU generation was not run.

User correction: the catalogue must not describe Turbo as a separate Turbo/compact base plus LoRA. Base and Turbo share the same full family base models; only the LoRA/settings make Turbo.

Correction verified: catalogue entries now show only `LTX 2.5 Base`, `LTX 2.5 Turbo`, `MiniMax H3 Base`, and `MiniMax H3 Turbo`; no label suggests a separate Turbo/compact base. Focused catalogue Vitest passed 3 tests, TypeScript typecheck passed, and scoped diff check passed.

User requested H3 Turbo strength 0.75 and asked whether LTX Turbo strength can be 0.6. WanGP's solver auto-injection uses a fixed 0.5 multiplier; the supported override is to explicitly select the same registered distilled LoRA at 0.6 for both guidance phases, which suppresses the automatic duplicate.

User confirmed WanGP's native distilled_8_steps LoRA strength of 0.5 is acceptable. The explicit 0.6 override and additive LoRA handling attempted in this correction are being removed; LTX Turbo remains unchanged.

Final correction: MiniMax H3 Turbo now sends `loras_multipliers=0.75|`. LTX 2.5 Turbo remains unchanged with `sample_solver=distilled_8_steps`; WanGP auto-applies the registered distilled LoRA at its native 0.5 strength.

Correction verification: `cd backend; uv run pytest tests/test_model_profiles.py tests/test_generation.py tests/test_wangp_model_packs.py -q` passed 133 tests (one existing pynvml deprecation warning). `pnpm typecheck:py` passed with 0 errors. Scoped `git diff --check` passed. No live GPU generation was run.

User supplied separate Kijai MiniMax-H3_comfy Turbo LoRAs for FL2VA and Ref2VA at multiplier `1.0|`. Hugging Face's model-tree API confirmed both exact files exist (FL2VA 314,878,200 bytes; Ref2VA 306,731,560 bytes).

Implemented mode-specific H3 Turbo selection: the profile defaults to the FL2VA Kijai LoRA, and the existing validated `h3_uses_ref2va` branch replaces only `activated_loras` with the Ref2VA Kijai LoRA. Both retain `loras_multipliers=1.0|`. The Turbo pack installs both files; Base remains LoRA-free.

Verification: `cd backend; uv run pytest tests/test_generation.py tests/test_wangp_model_packs.py tests/test_model_profiles.py -q` passed 134 tests (one existing pynvml deprecation warning). `pnpm typecheck:py` passed with 0 errors. Scoped `git diff --check` passed. Independent Orchestrate reviewer verdict: ship, no findings. Live WanGP/GPU generation was not run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added curated Base and Turbo variants for MiniMax H3 and LTX 2.5 while preserving stable saved profile and pack IDs. MiniMax H3 Base/Turbo retain the smaller GGUF Q4 text encoder and FP8-mixed video VAE. H3 Turbo now uses the user-supplied Kijai FL2VA LoRA for FL2VA requests and the separate Kijai Ref2VA LoRA for Ref2VA requests, each at `1.0|`; its automatic pack installs both files while H3 Base installs neither. LTX 2.5 Base/Turbo remain on `ltx2_25_22B`, with Turbo using WanGP's native `distilled_8_steps` system-LoRA path. The Model Manager retains the plain Base/Turbo names. Focused backend tests passed 134 tests and Pyright passed with 0 errors; earlier task validation also passed TypeScript typechecking, focused catalogue tests, and the production renderer/Electron/preload build. Independent reviewer verdict: ship. Live GPU generation remains unrun.
<!-- SECTION:FINAL_SUMMARY:END -->
