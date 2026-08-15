---
id: AIVS-010
title: Add curated variants for MiniMax H3 and LTX 2.5
status: Done
assignee:
  - '@codex'
created_date: '2026-08-13 13:06'
updated_date: '2026-08-15 16:36'
labels: []
dependencies:
  - AIVS-003
  - AIVS-008
modified_files:
  - backend/handlers/retake_handler.py
  - backend/handlers/video_generation_handler.py
  - backend/model_profiles/resolution_resolver.py
  - backend/model_profiles/video_profiles.py
  - backend/tests/test_director_compiler.py
  - backend/tests/test_director_generation.py
  - backend/tests/test_generation.py
  - backend/tests/test_media_crop.py
  - backend/tests/test_model_profiles.py
  - backend/tests/test_prompt_enhancement.py
  - backend/tests/test_wangp_model_packs.py
  - backend/wangp_model_packs.py
  - electron/python-setup.test.ts
  - electron/python-setup.ts
  - frontend/contexts/ProjectContext.test.ts
  - frontend/lib/model-profile-availability.test.ts
  - frontend/views/genspace/components/GenSpaceControls.test.tsx
  - frontend/views/genspace/constants.ts
  - frontend/views/genspace/logic/generation-requests.test.ts
  - frontend/views/genspace/logic/generation-requests.ts
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - frontend/views/genspace/video/VideoMediaInputs.tsx
priority: high
type: enhancement
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expose curated MiniMax H3 Fast/Quality and LTX 2.5 Fast/Quality generation variants using the full base WanGP checkpoints. LTX uses exact Fast/Quality settings; H3 Fast retains the mode-specific acceleration LoRAs while H3 Quality is the full-step non-LoRA path. Both families use clean development-stage AiVS profile and pack IDs, with H3 compact gguf_q4_k_m/fp8mix runtime and download configuration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 LTX 2.5 exposes only canonical Fast and Quality profiles, using profile IDs ltx2_25_fast and ltx2_25_quality and ordered Fast before Quality.
- [x] #2 LTX 2.5 Fast uses the requested distilled_8_steps, 8-step, guidance, perturbation, APG, CFG-star, and self-refiner settings.
- [x] #3 LTX 2.5 Quality uses the requested res2s, 15-step, guidance, perturbation, APG, CFG-star, and self-refiner settings.
- [x] #4 LTX model packs and the Electron catalogue use only ltx2_fast and ltx2_quality, both downloading the full ltx2_25_22B base model, with Fast selecting the native distilled solver behavior.
- [x] #5 No AiVS profile or pack uses the retired LTX IDs ltx2_22b_distilled, ltx2_25_22B, ltx2_base, or ltx2_turbo, and the legacy model=fast fallback is removed; the legitimate underlying WanGP model type ltx2_25_22B remains.
- [x] #6 MiniMax H3 exposes only canonical Fast and Quality profiles, using profile IDs minimax_h3_fast and minimax_h3_quality and ordered Fast before Quality.
- [x] #7 H3 Fast preserves the current 6-step, flow-shift 6, 0.75 LoRA multiplier, and mode-specific Kijai FL2VA/Ref2VA LoRAs; H3 Quality uses 20 steps, flow-shift 12, and no activated LoRA.
- [x] #8 H3 model packs and the Electron catalogue use only minimax-h3-fast and minimax-h3-quality while keeping the underlying WanGP FL2VA/Ref2VA model IDs unchanged.
- [x] #9 H3 Quality owns its canonical runtime config directly in ModelProfile; pack-level compact config remains only where needed for dependency download selection.
- [x] #10 Focused backend, frontend, and Electron profile/catalogue checks pass, along with relevant TypeScript and Python type checks.
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
1. Define canonical LTX Fast and Quality profiles with the exact requested settings and clean IDs.
2. Rename LTX packs, catalogue entries, defaults, and focused tests; remove legacy AiVS IDs and fallback.
3. Rename H3 product profiles and packs to Fast and Quality with clean canonical IDs, preserving the underlying WanGP model IDs and mode-specific LoRAs.
4. Put H3 Quality runtime defaults on its canonical ModelProfile while retaining pack-level config solely for download selection.
5. Run the narrow focused checks, inspect the complete diff, obtain fresh review, and record completion evidence.
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

User explicitly removed the prior saved-state compatibility requirement because the app is still in development. Clean canonical LTX profile IDs will be `ltx2_25_fast`/`ltx2_25_quality`, with pack IDs `ltx2_fast`/`ltx2_quality`; no legacy aliases or migrations will be retained. Existing uncommitted user change in `backend/model_profiles/video_profiles.py` sets H3 Turbo to 6 steps and must be preserved.

Scope kept surgical: generic WanGP bridge defaults and fixtures that legitimately exercise the registered `ltx2_25_22B_distilled` model type are not part of removing obsolete AiVS profile/pack IDs. Normal curated generation will use only `ltx2_25_22B` through the new Fast/Quality profiles.

Scope update: per the latest user direction, MiniMax H3 now follows the same Fast/Quality product naming as LTX 2.5. The accelerated LoRA profile is Fast and the full-step non-LoRA profile is Quality; development-stage cleanup intentionally adds no aliases for the superseded AiVS profile or pack IDs.

Final implementation uses clean Fast/Quality identities for both families. Retake's internal request now explicitly selects ltx2_25_fast after removal of the legacy model=fast fallback. H3 profile runtime config and model-pack download config remain deliberately duplicated because they serve generation and dependency selection respectively.

Final verification: from backend, `uv run pytest tests/test_model_profiles.py tests/test_generation.py tests/test_director_compiler.py tests/test_director_generation.py tests/test_media_crop.py tests/test_prompt_enhancement.py tests/test_wangp_model_packs.py -q` passed 187 tests with one existing PyTorch pynvml deprecation warning. From the repository root, `pnpm exec vitest run electron/python-setup.test.ts frontend/views/genspace/logic/generation-requests.test.ts frontend/views/genspace/components/GenSpaceControls.test.tsx` passed 31 tests across 3 files; `pnpm typecheck:py` passed with 0 errors; `pnpm typecheck:ts` passed; `git diff --check` passed with only line-ending notices. Exact retired-ID scan found no obsolete LTX/H3 AiVS variant IDs in product paths. Fresh reviewer verdict: ship, no findings. Live GPU/WanGP generation was not run.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: user
created: 2026-08-15 16:36
---
Human acceptance recorded: user confirmed the Fast/Quality variants work and explicitly approved the implementation.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented clean Fast/Quality variants for LTX 2.5 and MiniMax H3 across curated profiles, resolution mapping, generation routing, model packs, the Electron catalogue, frontend defaults/detection, and focused fixtures. LTX Fast and Quality both use the full ltx2_25_22B base with the exact requested solver/guidance settings. H3 Fast retains the current six-step mode-specific Kijai LoRA route at multiplier 0.75, while H3 Quality is the 20-step no-LoRA path; both use compact Q4/FP8-mix dependencies. Removed obsolete AiVS variant IDs and the legacy model=fast fallback, then fixed Retake at its request boundary by explicitly selecting ltx2_25_fast. Verification: 187 focused backend tests, 31 focused Vitest tests, Python and TypeScript typechecks, retired-ID scan, and git diff check all passed. Independent review found no issues. Live GPU generation remains unrun.
<!-- SECTION:FINAL_SUMMARY:END -->
