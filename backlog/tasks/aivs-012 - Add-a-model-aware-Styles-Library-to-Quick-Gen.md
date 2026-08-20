---
id: AIVS-012
title: Add a model-aware Styles Library to Quick Gen
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-15 18:01'
updated_date: '2026-08-19 12:16'
labels: []
dependencies: []
references:
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Soft_Enhance_Style_LoRa/resolve/main/LTX2.3_Soft_Enhance.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Fantasy_Painterly_Style_LoRa/resolve/main/Fantasy_Painterly.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Pixar_Toon_Style_LoRa/resolve/main/Pixar_Toon.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_90s_Animation_Style_LoRa/resolve/main/90sAnimationStyle.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Clay_Mation_Style_LoRa/resolve/main/Claymation.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX2.3_Cozy_Felt_Style_LoRa/resolve/main/CozyFelt.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Fantasy_Anime_Style_LoRa/resolve/main/Fantasy_Anime.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Fantasy_Realism_Style_LoRa/resolve/main/Fantasy_Realism.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Fantasy_Puppet_Style_LoRa/resolve/main/FantasyPuppetStyle.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Crisp_Enhance_Style_LoRa/resolve/main/LTX2.3_Crisp_Enhance.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Post_Apocalyptic_Style_LoRa/resolve/main/Post_Apocalyptic.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Paper_Cut_Out_Style_LoRa/resolve/main/PaperCutOutStyle.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Wild_West_Style_LoRa/resolve/main/Wild_West.safetensors
  - >-
    https://huggingface.co/vrgamedevgirl84/LTX_2.3_Cinematic_Sci-fi-Cyberpunk_Style_LoRa/resolve/main/Cinematic_sci-fi-cyberpunk.safetensors
modified_files:
  - backend/api_types.py
  - backend/handlers/model_profiles_handler.py
  - backend/handlers/video_generation_handler.py
  - backend/model_profiles/policies.py
  - backend/model_profiles/profiles.py
  - backend/model_profiles/types.py
  - backend/model_profiles/video_profiles.py
  - backend/services/wangp_bridge.py
  - backend/tests/fakes/fake_wangp_bridge.py
  - backend/tests/test_generation.py
  - backend/tests/test_model_profiles.py
  - backend/tests/test_wangp_bridge.py
  - frontend/components/StylesLibraryModal.tsx
  - frontend/hooks/generation/request-builders.test.ts
  - frontend/hooks/generation/request-builders.ts
  - frontend/lib/apply-generation-params.ts
  - frontend/types/generation.ts
  - frontend/types/model-profiles.ts
  - frontend/types/project.ts
  - frontend/views/genspace/constants.ts
  - frontend/views/genspace/hooks/useGenSpaceSettingsState.ts
  - frontend/views/genspace/logic/generation-assets.test.ts
  - frontend/views/genspace/logic/generation-assets.ts
  - frontend/views/genspace/logic/generation-requests.ts
  - frontend/views/genspace/types.ts
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - public/styles/ltx25/soft-enhance.webp
  - public/styles/ltx25/fantasy-painterly.webp
  - public/styles/ltx25/pixar-toon.webp
  - public/styles/ltx25/90s-animation.webp
  - public/styles/ltx25/claymation.webp
  - public/styles/ltx25/cozy-felt.webp
  - public/styles/ltx25/fantasy-anime.webp
  - public/styles/ltx25/fantasy-realism.webp
  - public/styles/ltx25/fantasy-puppet.webp
  - public/styles/ltx25/crisp-enhance.webp
  - public/styles/ltx25/post-apocalyptic.webp
  - public/styles/ltx25/paper-cut-out.webp
  - public/styles/ltx25/wild-west.webp
  - public/styles/ltx25/cinematic-sci-fi-cyberpunk.webp
priority: medium
type: feature
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a shared Styles Library experience to Quick Gen so users choose a model-appropriate visual style through one consistent modal, regardless of whether a future style is implemented by a LoRA or prompt injection. Start with the supplied fourteen LTX 2.5-compatible style LoRAs. The catalogue must remain backend-curated and simple to extend; user-authored styles and public style-type controls are out of scope.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A supported Quick Gen model exposes a Styles control that opens an accessible modal with a thumbnail grid of only the styles curated for that model family.
- [x] #2 A user can select one style, see the current selection in Quick Gen, reopen or clear it, and generate without being shown whether the style is implemented by a LoRA or prompt text.
- [x] #3 The LTX 2.5 catalogue contains all fourteen supplied styles with stable identifiers, human-readable names, thumbnails, and the supplied upstream sources.
- [x] #4 Selecting an LTX 2.5 style makes its LoRA available locally and includes it in the WanGP generation request without replacing the model profile's required LoRA behavior.
- [x] #5 Models without curated styles keep their existing generation behavior and do not expose a misleading usable Styles selection.
- [x] #6 The backend remains the single curated source of truth for style compatibility and implementation details, including future prompt-backed styles.
- [x] #7 Focused automated checks cover the stable catalogue/request-compilation contract, and the Styles modal is visually smoke-tested in Electron.
- [x] #8 A curated style may define one backend-only style prompt with or without a LoRA; generation appends that prompt exactly once, while styles without one and requests without a style preserve their prompt.
- [x] #9 During first-time style LoRA download, generation progress remains serializable: phaseIndex stays null or integer and "Downloading selected style" is reported via statusDetail.
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
1. Correct the existing style LoRA download progress callback so its message occupies the statusDetail slot.
2. Extend the closest WanGP bridge regression test to assert the exact callback payload.
3. Run the focused bridge test and backend typecheck, inspect the scoped diff, and return the task to Human Review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the planned backend-owned unified style contract without exposing LoRA/prompt action types to the renderer. Both LTX 2.5 profiles inherit the same fourteen-entry catalogue. Generation resolves styleId at the backend trust boundary, uses WanGP's file_type=1 LoRA-only download path, and appends style LoRAs/multipliers without replacing profile or multi-shot LoRAs. Prompt-backed definitions are supported by the same internal action type for future model families. The modal traps keyboard focus, restores the opening trigger, and remains hidden for models/operations without curated styles.

Final verification: primary focused backend style contracts 3 passed; primary focused frontend request/persistence contracts 13 passed. Implementation worker's broader focused runs passed 5 backend contracts and 29 frontend tests. pnpm typecheck:ts passed; pnpm typecheck:py reported 0 errors; pnpm build:frontend passed; git diff --check reported no whitespace errors.

Electron smoke in the real app passed: 14 style cards, 14 loaded thumbnails, selection/reopen/clear/Escape, no renderer console errors. Post-review focus smoke passed initial Close focus, Shift+Tab/Tab containment, Escape close, and focus restoration to the Styles trigger.

Independent final review verdict: ship, no findings. A broader backend run had 162 passed and one pre-existing unrelated Director exact-settings assertion failure. No live first-time third-party LoRA download and GPU generation was run; remote availability and runtime loading remain the human validation boundary.

Human Review follow-up: user requested prompt injection for LTX 2.5 style LoRAs, then refined the internal contract from trigger_words to a versatile style_prompt usable by both LoRA-backed and future prompt-only styles. Upstream Hugging Face model cards were checked for the recommended/main prompt phrases.

Follow-up implementation: renamed the internal prompt action to `style_prompt`; styles may now be LoRA-only, prompt-only, or LoRA plus prompt. Twelve applicable LTX catalogue entries carry their upstream main/recommended suffix; Soft Enhance and Crisp Enhance remain prompt-neutral. The existing pre-WanGP injection point appends the suffix once and the public style DTO remains unchanged.

Follow-up verification: `rtk uv run pytest` over the prompted-LoRA/catalogue/policy nodes passed 3 tests; the reviewer-requested synthetic prompt-only generation node passed separately and proves exact-once injection with no LoRA download. `rtk pnpm typecheck:py` reported 0 errors/0 warnings. Full `rtk git diff --check` passed. Fresh independent correction review verdict: ship, no findings. No live GPU generation was run because this changes backend prompt compilation only.

Human Review regression follow-up (2026-08-19): the supplied runtime log showed GET /api/generation/progress returning HTTP 500 because ensure_style_lora passed "Downloading selected style" as the fifth callback argument, which maps to phaseIndex rather than statusDetail. The fix is scoped to the callback payload and its existing bridge test.

Regression fix (2026-08-19): `ensure_style_lora` now supplies eight positional metadata values before the human-readable message, so `phaseIndex` remains null and the message maps to `statusDetail`. The existing bridge test now asserts the exact nine-value callback tuple as well as the WanGP download request.

Regression verification: `rtk uv run pytest tests/test_wangp_bridge.py::test_ensure_style_lora_downloads_through_runtime_module -q` passed (1 test); `rtk pnpm typecheck:py` passed with 0 errors/0 warnings; full `git diff --check` passed. Fresh independent correction review verdict: ship, no findings. A live first-time model download and end-to-end HTTP poll were not rerun because the deterministic callback contract directly covers the logged validation failure.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Styles Library now uses the backend-owned `style_prompt` contract for LoRA-backed and future prompt-only styles. LTX 2.5 catalogue prompts are injected exactly once without changing the public style DTO or required profile LoRAs.

This Human Review regression follow-up also fixes first-download progress polling: `ensure_style_lora` now places "Downloading selected style" in `statusDetail` rather than `phaseIndex`, preventing `/api/generation/progress` response validation failures. The closest bridge test asserts the complete callback payload.

Verification: focused style-prompt tests passed previously; the new bridge regression passed (1 test); backend Pyright passed with 0 errors/0 warnings; full `git diff --check` passed. Fresh independent review verdict: ship. No live GPU generation or first-time remote LoRA download was run.
<!-- SECTION:FINAL_SUMMARY:END -->
