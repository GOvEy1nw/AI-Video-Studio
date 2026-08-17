---
id: AIVS-015
title: Add Media Flow Upscale tools to Quick Gen image and video
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-16 19:02'
updated_date: '2026-08-17 10:35'
labels:
  - Quick Gen
  - WanGP
  - Upscale
dependencies: []
modified_files:
  - backend/api_types.py
  - backend/app_factory.py
  - backend/app_handler.py
  - backend/handlers/__init__.py
  - backend/handlers/media_upscale_handler.py
  - backend/_routes/media_upscale.py
  - backend/services/wangp_bridge.py
  - backend/tests/test_media_upscale.py
  - frontend/contexts/ProjectContext.tsx
  - frontend/contexts/ProjectContext.test.ts
  - frontend/hooks/use-generation.ts
  - frontend/lib/apply-generation-params.ts
  - frontend/types/project.ts
  - frontend/types/upscale.ts
  - frontend/types/video-tools.ts
  - frontend/views/genspace/GenSpaceSelectedGeneration.tsx
  - frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx
  - frontend/views/genspace/components/UpscalePanel.tsx
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts
  - frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts
  - frontend/views/genspace/hooks/useGenSpaceResultPersistence.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts
  - frontend/views/genspace/hooks/useGenSpaceUpscaleState.ts
  - frontend/views/genspace/hooks/useGenSpaceUpscaleState.test.ts
  - frontend/views/genspace/image/ImageGenPanel.tsx
  - frontend/views/genspace/image/ImageModeTabs.tsx
  - frontend/views/genspace/image/image-profile-options.ts
  - frontend/views/genspace/logic/generation-assets.ts
  - frontend/views/genspace/logic/generation-assets.test.ts
  - frontend/views/genspace/logic/settings-restore.ts
  - frontend/views/genspace/logic/settings-restore.test.ts
  - frontend/views/genspace/types.ts
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - frontend/views/genspace/video/VideoModeTabs.tsx
  - frontend/views/genspace/video/video-tools.ts
priority: medium
type: feature
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a curated Upscale tool mode to Quick Gen Image and Video so users can enhance existing media locally through Wan2GP Media Flow while keeping project-owned input/output handling and the shared generation lifecycle.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Quick Gen Image and Quick Gen Video each expose an Upscale tool mode that accepts compatible existing media from the current project or an approved local file.
- [x] #2 Each media mode presents only curated Wan2GP Media Flow upscale methods compatible with that media type, including FlashVSR, Lanczos, LTX 2.5 Upscale, and SeedVR2 where the runtime supports them.
- [x] #3 Upscale requests run exclusively through the authenticated local backend and WanGP/Wan2GP Media Flow, with no alternate inference runtime or hosted fallback.
- [x] #4 Upscale progress, cancellation, errors, model availability/download state, and completed-output persistence reuse existing AiVS owners and preserve project isolation.
- [x] #5 Upscale settings restore safely through supported Quick Gen persistence and Copy Settings flows without breaking existing image or video modes.
- [x] #6 Focused contract checks, TypeScript and Python type checks, the frontend production build, and an Electron interaction smoke establish the changed behavior; any unavailable live GPU validation is reported.
- [x] #7 Upscale method selection uses the same AiVS dropdown/menu presentation as established Quick Gen selectors and does not show a synthetic unavailable option after the catalog loads.
- [x] #8 Upscale scale selection uses a slider constrained to the selected method's supported scale values and clearly displays the selected multiplier.
- [x] #9 All product-visible upscale scale choices start at 2x; unsupported 1x values are neither displayed nor submitted.
- [x] #10 The selected-generation footer places an Upscale action between Use Image/Use Video and Remove, and invoking it opens the matching Quick Gen Upscale mode with that asset as the source.
- [x] #11 Completed upscale outputs are persisted as linked versions of their source asset, are grouped into one Asset Library stack instead of separate cards, and preserve project isolation and existing unstacked asset compatibility.
- [x] #12 Selecting a stacked asset opens its versions as accessible thumbnail tabs in the selected-generation viewer; switching tabs changes the displayed media and associated metadata/actions without duplicating or deleting the underlying assets.
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
1. Add a backend-owned curated upscale catalog and typed Media Upscale GET/POST route. Validate approved image/video source paths, media-method compatibility, and allowed scale factors in one domain handler that uses the existing shared generation state.
2. Extend WanGPBridge with a media-postprocessing call built on WanGPSession.submit_media_postprocessing and the existing SessionJob event/cancel/output loop. Seed only missing app-owned FlashVSR defaults; preserve explicit user configuration.
3. Add one shared Quick Gen upscale state/control surface. Expose Upscale as an Image process mode and as a Video tool entry, with compatible method/scale choices fetched from the backend catalog and existing project/file media input handling.
4. Submit upscale through useGenerationJob, then reuse immutable project-scoped result persistence. Store source, media kind, method, and scale in GenerationParams so Copy Settings restores the correct Image or Video Upscale mode.
5. Protect the stable contracts with focused backend bridge/route and frontend request/restore/persistence tests. Run the task-required TypeScript/Python type checks, frontend production build, and an Electron interaction smoke; report live GPU/model validation separately.

Boundary: initial curated methods are Lanczos, FlashVSR, FlashVSR 2-pass, SeedVR2 for image/video at WanGP-supported scales, plus LTX 2.5 Pixel Spatial Upscale for video at 2x. Model-backed methods use WanGP automatic first-run downloads and the existing job model-download progress; no separate Model Manager pack is added because WanGPSession exposes no complete postprocessor download/availability manifest.

6. Human-review UI follow-up: replace the native method `<select>` with the shared `SettingsDropdown` used by resolution controls; render catalog loading/error only in the disabled trigger and existing alert, never as a loaded menu option. Replace the scale `<select>` with one native range slider whose integer positions map to the selected method's discrete supported scale list, displaying the current multiplier. Verify with TypeScript, production frontend build, focused interaction coverage only if an existing stable test boundary is practical, and an Electron visual smoke.

7. Integrated Upscale follow-up: (a) make the backend-owned curated catalog expose only 2x–4x scales so UI and request validation share the same minimum; (b) add a selected-generation Upscale action that directly sets the existing Image/Video Upscale controller mode and preserves the source Asset ID; (c) reuse Asset.takes as the version stack, extending optional per-take metadata so active-version preview, model/settings, and metadata remain coherent while retaining stable Asset IDs and old-project compatibility; (d) have upscale result persistence append a take when the source matches the current project by ID/path/URL, otherwise preserve the current add-new-asset behavior for approved local sources; (e) render accessible compact take tabs in the selected-generation pane using the existing setAssetActiveTake owner. Preserve whole-stack Remove semantics and existing per-take deletion through the current take UI. Protect catalog minimum, take persistence/project isolation, footer handoff, and tab switching with focused tests; run TypeScript/Pyright, production build, backend focused pytest, independent review, and real-Electron visual QA.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the planned dedicated media-upscale boundary without touching curated generation profiles/model packs: the backend owns the compatible method catalog and validation, WanGPBridge submits through WanGPSession.submit_media_postprocessing with the public spatial_upsampling keyword, and Quick Gen reuses its existing media input, job lifecycle, cancellation, immutable submission snapshot, result persistence, and settings restoration owners. FlashVSR defaults are inserted only when missing from the app-owned config; explicit user settings remain intact. Review caught and resolved the WanGP keyword mismatch plus a catalog startup failure trap; catalog failures now surface with a retry action and stale requests cannot overwrite state. Independent re-review verdict: ship.

Final verification: `cd backend; rtk uv run pytest tests/test_media_upscale.py -q` — 2 passed (existing pynvml deprecation warning only). `rtk pnpm exec vitest run frontend/views/genspace/hooks/useGenSpaceUpscaleState.test.ts frontend/views/genspace/logic/generation-assets.test.ts frontend/views/genspace/logic/settings-restore.test.ts` — 3 files, 18 tests passed. `rtk pnpm typecheck:ts` — passed. `rtk pnpm typecheck:py` — 0 errors, 0 warnings. `rtk pnpm build:frontend` — renderer, Electron main, and preload builds passed (existing >500 kB chunk advisory only). `rtk git diff --check` — passed.

Electron smoke: normal `pnpm dev` launch reached healthy local backend/WanGP preload. Image Upscale showed Lanczos, FlashVSR, FlashVSR 2-pass, SeedVR2 and excluded LTX; Video Upscale additionally showed LTX 2.5 Pixel Upscale with only 2x. Both omitted prompt/model controls, kept the action disabled without input, and the shared source button was keyboard-focusable. No generation/download or project mutation was performed. Live GPU upscale output quality, first-run model download, cancellation, and native picker/remove flows remain unexecuted and are reported as runtime validation limits.

Follow-up research found UpscalePanel used native `<select>` controls while established Quick Gen resolution controls use `SettingsDropdown`. Supported scales are discrete backend values, so the slider will index that array instead of inventing unsupported intermediate multipliers.

Human-review UI follow-up verification: `rtk pnpm typecheck:ts` passed; `rtk pnpm build:frontend` passed renderer, Electron main, and preload after rerunning with normal repository read access (existing >500 kB chunk advisory only); `rtk git diff --check` passed. No new automated test was added because this was a presentation/control-composition change and the existing Upscale state contracts were unchanged.

Real-Electron `pnpm dev:debug` renderer inspection confirmed Image Upscale uses the shared SettingsDropdown/FloatingMenu with exactly Lanczos, FlashVSR, FlashVSR 2-pass, and SeedVR2 and no synthetic Loading/Unavailable row. Method received keyboard focus and Space opened it. The Scale range showed 2× and ArrowRight moved it to 2.5× with min=0/max=6/step=1 over the backend-supported values. Video Upscale exposed the same shared menu/slider surface. The final LTX-only disabled-slider state was not separately reached during this follow-up smoke; its one-value behavior remains enforced by the shared component (`scales.length <= 1`) and the previously verified video catalog. Normal `pnpm dev` readiness stalled in this environment; the supported debug launch rendered the actual Electron UI. No media, settings, downloads, or project data changed.

Architecture research confirmed Asset.takes is already AiVS's persisted one-card version stack used by retakes, including active URL/path swapping and gallery-card take navigation. No groupId/parentId collection or project migration will be introduced. Optional per-take metadata will let Copy Settings and selected metadata follow the active source/upscaled tab; legacy takes remain readable via fallbacks.

Integrated stacking follow-up: product catalog now starts at 2x. Selected image/video assets expose Upscale in the footer and preserve stable asset identity into the matching Quick Gen mode. Completed upscales append metadata-bearing Asset.takes so Asset Library keeps one card/stable ID; approved local inputs without a project source remain normal new assets.

Selected image/video stacks render compact accessible version tabs. Active take projection updates URL/path, generation metadata, Copy Settings, duration, resolution, generation time, and displayed creation time. Legacy takes use compatible fallbacks; explicit null sentinels prevent uploaded originals from inheriting upscale metadata. Arrow/Home/End tab navigation is isolated from global gallery shortcuts.

Verification: backend `rtk uv run pytest tests/test_media_upscale.py -q` 2 passed; frontend focused four-file Vitest 25 passed; retry/catalog hook Vitest 2 passed; `rtk pnpm typecheck:ts` passed; `rtk pnpm typecheck:py` 0 errors/warnings; `rtk pnpm build:frontend` passed renderer/main/preload with existing large-chunk advisory; `rtk git diff --check` passed. Independent correction re-review found no remaining issues.

Final real-Electron smoke reached backend Ready but the initial catalog request displayed its retryable load-error state; the allotted recovery rerun did not reach Retry. No project data was mutated. Loaded-catalog controls were verified in the earlier Electron smoke, while this follow-up's footer/stack visual journey remains covered by focused component, context, and persistence tests rather than a fresh runtime traversal. No GPU upscale/model download was run.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: user
created: 2026-08-17 08:11
---
Human review requested the Upscale method control match established AiVS selectors, scale become a slider, and the normal loaded catalog stop showing the synthetic Unavailable placeholder.
---

author: user
created: 2026-08-17 10:00
---
Human review requested minimum 2x scales, an Upscale action in the selected-generation footer, and source/upscaled version stacking in the Asset Library with selected-generation tabs.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

- Integrated Upscale into selected-generation workflows: image/video assets now have an Upscale footer action that opens the matching Quick Gen mode with stable source identity.
- Limited product-visible scales to 2x and above through the backend-owned catalog.
- Reused the existing persisted `Asset.takes` version model so source and upscaled outputs share one Asset Library card and stable asset ID; unmatched approved local inputs retain normal add-new-asset behavior.
- Added per-take generation metadata projection and compact accessible image/video version tabs. Switching versions updates preview, settings, metadata, and creation time while preserving legacy project compatibility and existing whole-stack Remove semantics.
- Isolated tab keyboard navigation from global gallery shortcuts; independent re-review found no remaining findings.

## Verification

- Backend focused pytest: 2 passed.
- Frontend focused Vitest: 25 passed across stacking/context/persistence/assets; catalog retry state: 2 passed.
- TypeScript: passed. Pyright: 0 errors and 0 warnings.
- Renderer, Electron main, and preload production bundles: passed; existing large-chunk advisory only.
- Diff whitespace check: passed.

## Runtime limits

The final real-Electron run reached backend Ready but its initial catalog request remained in the retryable load-error state, and the bounded recovery attempt did not reach Retry. Earlier real-Electron coverage verified the loaded shared dropdown/slider surface and 2x default. This follow-up did not mutate project data to fabricate a stack, and no GPU upscale or model download was run; footer/stack behavior is established by focused component, context, and persistence tests.
<!-- SECTION:FINAL_SUMMARY:END -->
