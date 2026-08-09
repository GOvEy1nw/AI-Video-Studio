---
id: AIVS-036
title: Add typed feature capability and dependency policies
status: Done
assignee:
  - Codex
created_date: '2026-08-06'
updated_date: '2026-08-08 13:49'
labels:
  - maestro-programme
  - architecture
  - model-profiles
dependencies:
  - AIVS-035
modified_files:
  - backend/model_profiles/policies.py
  - backend/model_profiles/profiles.py
  - backend/api_types.py
  - backend/handlers/model_profiles_handler.py
  - backend/tests/test_model_profiles.py
  - frontend/types/model-profiles.ts
  - frontend/contexts/ModelProfilesContext.tsx
  - frontend/contexts/ModelProfilesContext.test.tsx
  - frontend/lib/model-profile-availability.ts
  - frontend/lib/model-profile-availability.test.ts
  - frontend/lib/model-profile-policy.ts
  - frontend/lib/model-profile-policy.test.ts
  - frontend/views/genspace/video/VideoModeTabs.tsx
  - frontend/views/genspace/video/VideoModeTabs.test.tsx
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - frontend/components/UseVideoDropdown.tsx
  - docs/MODEL_CAPABILITY_POLICY.md
type: enhancement
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace product inference from loose WanGP metadata with explicit backend-owned policies for video audio, speech, SFX, editing operations, render strategies, and required model packs.

**Programme wave:** 0  
**Complexity:** Medium  
**Dependencies:** AIVS-035
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every new programme capability is explicit and backend-owned.
- [x] #2 Frontend no longer parses raw WanGP setting strings to choose product UI.
- [x] #3 Required pack IDs and handler ownership are validated.
- [x] #4 Older saved projects and older-shaped profile responses remain readable.
- [x] #5 System dependencies are distinct from user LoRAs.
- [x] #6 Focused tests, Pyright, TypeScript, and build pass.
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
1. Add a bounded `backend/model_profiles/policies.py` owner for frozen capability/dependency policies, stable IDs, and registry validation. Attach additive policy fields to `ModelProfile`; populate LTX with explicit `ltx2_turbo` pack ownership, backend-only system-LoRA dependency IDs, current video-audio/speech/SFX behavior, all current Video Tool operations (stable Reframe/Extend; experimental system-LoRA tools), and the Director single-pass render strategy. Keep WanGP letter codes and URLs out of the API policy contract.
2. Extend Pydantic response models and `ModelProfilesHandler` serialization additively. Preserve every existing field, profile ID, media role, and raw `wangpMetadata` compatibility field.
3. Mirror the policy contract in strict TypeScript. Normalize older-shaped responses at the `ModelProfilesProvider` fetch boundary using safe disabled/empty defaults; use explicit `requiredPackIds` for model-pack availability with the existing `wangpModelType` fallback only for older responses.
4. Add small pure frontend selectors for enabled audio slots/modes, Video Tools, Director strategies, and disabled reasons. Do not build or redesign feature panels.
5. Extend focused backend/profile and frontend/provider/selector tests for serialization, pack/handler/system-dependency invariants, LTX policy values, and old-response defaults. Document capability promotion and the system-dependency/user-LoRA boundary.
6. Run focused pytest/Vitest, Pyright, TypeScript, and the frontend production build; inspect the complete diff and obtain independent review before finalizing.

Review correction: wire the existing VideoModeTabs and UseVideoDropdown option eligibility/disabled reason to the normalized backend `videoEdits` policy via the pure selectors, while retaining local labels/icons. Add one focused interaction test for a policy-hidden/unavailable operation. This is integration of the existing policy contract, not a new feature panel or UI redesign.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Record approved deviations, source revisions, exact commands/results, runtime hardware, screenshots or recordings where relevant, and resulting commit/PR SHAs here.

2026-08-07: Started from the only Ready task. Declared dependency AIVS-035 is absent from the active Backlog index, repository tree, and Git history; because AIVS-036 is explicitly Ready and its scope is self-contained, treating the reference as stale/non-gating unless implementation research reveals a missing prerequisite.

2026-08-07 research: Current renderer does not parse `wangpMetadata.settingValues`; raw WanGP runtime fields are retained only for compatibility. The only runtime metadata UI read is family grouping. Pack readiness currently derives from `wangpModelType`, but LTX profile `ltx2_22b_distilled` explicitly maps to pack `ltx2_turbo`. Video Tool system LoRAs are backend-owned via `VIDEO_TOOL_LORA_URLS`; they must be represented as non-user-selectable system dependencies, not user LoRAs.

2026-08-07 independent review verdict `fix-first`: backend/API/compatibility/invariants passed, but AC #2 was incomplete because existing Video Tool menus still used static eligibility and Retake gating. Correcting those consumers and rereviewing.

2026-08-08 review correction completed: VideoModeTabs and UseVideoDropdown now filter presentation options through normalized backend policy; Retake disabled state/reason is policy-owned; unavailable selected tools fall back safely. Focused correction tests, TypeScript, build, and targeted diff check passed.

2026-08-08 final verification: backend profile pytest 62 passed (one unrelated Torch/pynvml FutureWarning); focused frontend compatibility/policy/availability tests 8 passed; correction tests 4 passed; Pyright clean; TypeScript clean; renderer/Electron/preload production build passed. Native Electron/real WanGP generation not run because no runtime, generation mapping, IPC, persistence, model asset, or licence behavior changed. Independent rereview verdict: ship, no findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented additive backend-owned capability and dependency policies for curated model profiles.

What changed:
- Added frozen policy types and runtime invariants for video audio, speech, SFX, Video Tool/edit operations, Director render strategies, required model-pack IDs, handler owners, and non-user-selectable system dependencies.
- Populated LTX 2.3 Fast with explicit `ltx2_turbo` pack ownership, stable/experimental/hidden capability status, current source/duration behavior, opaque system-LoRA dependency IDs, and a single-pass Director strategy. WanGP letter codes and dependency URLs remain backend-private.
- Extended the model-profile API and strict TypeScript mirror additively. Older-shaped responses normalize to disabled/empty policies; existing fields, profile IDs, media roles, saved projects, and legacy availability mapping remain readable.
- Model-pack readiness now prefers explicit pack IDs and falls back to `wangpModelType` for older responses.
- Existing Video Tool menus now use normalized backend policies for eligibility and Retake disabled reasons; local static data owns labels/icons/order only.
- Documented capability promotion and the system-dependency versus future user-LoRA boundary.

Verification:
- `uv run pytest tests/test_model_profiles.py -q`: 62 passed; one pre-existing Torch/pynvml FutureWarning.
- Focused profile compatibility/policy/availability Vitest: 3 files, 8 tests passed.
- Review-correction Vitest (`VideoModeTabs`, policy helper, availability): 3 files, 4 tests passed.
- `pnpm typecheck:py`: 0 errors/warnings.
- `pnpm typecheck:ts`: passed.
- `pnpm build:frontend`: renderer, Electron main, and preload builds passed.
- Targeted `git diff --check`: passed.
- Independent rereview verdict: `ship`, no findings.

Manual/runtime scope:
- No WanGP source, runtime, model asset, licence, generation mapping, persistence schema, preload, or IPC behavior changed; native Electron/real WanGP generation was therefore not required. Installed/missing pack behavior, old response normalization, and policy-driven disabled options were covered by focused automated tests.
- An accidentally broad frontend wrapper run ignored file filters and exposed an unrelated existing `MusicGenPanel.test.tsx` failure; it is not attributed to or used as evidence for this task.
<!-- SECTION:FINAL_SUMMARY:END -->

## Current State

`ModelProfile` exposes useful booleans and input roles, but the frontend cannot reliably distinguish Soundtrack, control-video audio, Reference Voice, TTS/SFX, editing-operation readiness, or hidden auxiliary LoRAs/checkpoints.

## Target State

Strict policy dataclasses serialised by `/api/model-profiles`, mirrored in frontend types, with additive compatibility defaults and invariants linking every visible capability to a valid handler and pack.

## API / Runtime Contract

The profile response gains additive `videoAudio`, `speech`, `sfx`, `videoEdits`, and optional render-strategy objects. Raw WanGP setting strings are not a renderer contract.

## Persistence and Compatibility

No project migration. Saved generations continue to reference existing stable profile IDs and media roles.

## Existing Files Expected to Change

- backend/model_profiles/profiles.py
- backend/api_types.py
- backend/handlers/model_profiles_handler.py
- frontend/types/model-profiles.ts
- frontend/contexts/ModelProfilesContext.tsx
- backend/tests/test_model_profiles.py
- frontend/contexts/ModelProfilesContext.test.tsx

## Proposed New Files

- backend/model_profiles/policies.py
- docs/MODEL_CAPABILITY_POLICY.md

## WanGP / External Runtime Files to Inspect or Change

- None.

## Required Error and Recovery States

- unknown pack ID
- policy declares unsupported handler
- backend/frontend schema drift
- older cached response lacks policies
- invalid limits
- system dependency exposed as user option

## Automated Validation

- policy invariant pytest
- profile serialisation tests
- frontend compatibility-default tests
- selector pure tests
- type checks

## Manual / Real-Runtime QA

- switch installed/missing profiles
- refresh Model Manager
- old-shaped cached response
- disabled reasons in Video/Director

## Non-Goals

- building feature panels
- schema-generated universal forms
- exposing every WanGP model
- user LoRA management

## Recommended Commit / PR Split

- Commit 1: backend policy types and invariants.
- Commit 2: API/frontend mirror and compatibility defaults.
- Commit 3: selector helpers, tests, and documentation.

## Required Reading

- AGENTS_PRD.md
- backend/architecture.md
- docs/GENSPACE_ARCHITECTURE.md
- docs/TESTING_POLICY.md
