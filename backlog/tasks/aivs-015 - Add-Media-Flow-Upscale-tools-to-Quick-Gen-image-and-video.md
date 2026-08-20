---
id: AIVS-015
title: Add Media Flow Upscale tools to Quick Gen image and video
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-16 19:02'
updated_date: '2026-08-20 17:10'
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
  - backend/handlers/image_generation_handler.py
  - backend/handlers/media_upscale_handler.py
  - backend/handlers/video_generation_handler.py
  - backend/_routes/media_upscale.py
  - backend/services/wangp_bridge.py
  - backend/tests/test_generation.py
  - backend/tests/test_media_upscale.py
  - electron/lib/project-asset-import.test.ts
  - electron/lib/project-asset-import.ts
  - frontend/components/SettingsDropdown.tsx
  - frontend/contexts/ProjectContext.test.ts
  - frontend/contexts/ProjectContext.tsx
  - frontend/hooks/generation/types.ts
  - frontend/hooks/use-generation.ts
  - frontend/lib/apply-generation-params.ts
  - frontend/types/project.ts
  - frontend/types/upscale.ts
  - frontend/types/video-tools.ts
  - frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx
  - frontend/views/genspace/GenSpaceSelectedGeneration.tsx
  - frontend/views/genspace/components/UpscalePanel.tsx
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts
  - frontend/views/genspace/hooks/useGenSpaceResultPersistence.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts
  - frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts
  - frontend/views/genspace/hooks/useGenSpaceUpscaleState.test.ts
  - frontend/views/genspace/hooks/useGenSpaceUpscaleState.ts
  - frontend/views/genspace/image/ImageGenPanel.tsx
  - frontend/views/genspace/image/ImageModeTabs.tsx
  - frontend/views/genspace/image/image-profile-options.ts
  - frontend/views/genspace/logic/generation-assets.test.ts
  - frontend/views/genspace/logic/generation-assets.ts
  - frontend/views/genspace/logic/settings-restore.test.ts
  - frontend/views/genspace/logic/settings-restore.ts
  - frontend/views/genspace/types.ts
  - frontend/views/genspace/video/RetakePanel.tsx
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - frontend/views/genspace/video/VideoModeTabs.tsx
  - frontend/views/genspace/video/VideoSourceDropZone.tsx
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
- [x] #13 Completed image/video upscales are always moved into the immutable submission project's generated folder before persistence; move/save failures surface as recoverable errors and do not silently leave the project pointing at the app output staging path.
- [x] #14 Video processing tools other than Generate use the same media dropzone presentation as Video Upscale without changing their source-media behavior.
- [x] #15 Image and Video Upscale place the method selector in the same location and visual treatment as the standard model selector/dropdown.
- [x] #16 The Selected Generation information bar displays the active version's seed when available.
- [x] #17 Selected Generation reports the actual decoded final image/video resolution rather than only requested or stored metadata.
- [x] #18 Selected Generation formats generation duration as mm:ss instead of raw seconds.
- [x] #19 The Selected Generation Copy Prompt action is removed without changing Copy Settings or other footer actions.
- [x] #20 Clicking the selected video toggles play/pause in addition to the existing playback button.
- [x] #21 Selected video playback includes a loop toggle that is enabled by default.
- [x] #22 Upscaled image/video versions without a prompt are titled Upscale #x using their recorded scale multiplier.
- [x] #23 Upscaled versions identify the actual upscale method instead of inheriting the source generation model.
- [x] #24 A/B comparison renders the active A image on the A side and the Ctrl-selected B image on the B side.
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
1. Harden the existing project-asset move path with bounded Windows transient retries, and prevent upscale completion from persisting an AppData staging path when transfer still fails; surface the existing local error and retain the result for recovery. Verify with the focused native transfer and GenSpace persistence regressions.
2. Carry the actual resolved image/video seed through the existing backend response, generation state, immutable submission result, AssetTake, and active-take projection without changing stable asset IDs or project schema shape. Verify with focused backend/frontend generation-asset tests.
3. Reuse the shared MediaInputSlot and model-dropdown trigger patterns for video tools and both Upscale panels. Verify with TypeScript and the frontend build; avoid brittle layout assertions.
4. Update Selected Generation to use decoded media dimensions, mm:ss generation time, seed metadata, upscale-aware title/method attribution, click-to-toggle video playback, default-on loop control, no Copy Prompt action, and correct A/B visual identity. Verify in the existing focused Selected Generation test.
5. Inspect the complete diff, run the narrowest combined checks, perform Electron visual smoke testing where the desktop runtime permits, obtain an independent review, record projectmem fixes, and move AIVS-015 to Human Review with exact evidence.
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

AIVS-015 follow-up completed. Native generated-output moves now retry transient Windows locks, preserve/restore colliding destinations, treat stale-backup cleanup as best-effort, and never persist an upscale staging path after transfer failure. Resolved seeds flow backend response -> generation state -> AssetTake. Video tools share the Upscale source slot; Upscale Method uses the model-selector presentation. Selected Generation now uses decoded dimensions, zero-padded mm:ss, active-take seed and upscale method/title, click-to-toggle video, default-on loop, no Copy Prompt, and correct A/B identity.

Follow-up verification: combined focused frontend/native suite 5 files / 42 tests passed; correction suite Selected Generation + native transfer 2 files / 19 tests passed; final native retry/restore/cleanup suite 16 tests passed. Backend seed tests 4 passed (56 deselected). `pnpm typecheck:ts` passed; `pnpm typecheck:py` reported 0 errors; `pnpm build:frontend` passed renderer, Electron main, and preload (existing large-chunk advisory only); `git diff --check` exited 0 with CRLF conversion warnings only. Independent final review verdict: ship.

Electron visual QA limitation: the actual app was running against Vite, but exposed no CDP endpoint or desktop-control surface; a remote-debug launch exited before port 9222 listened. No screenshot or interaction evidence was obtainable, so Retake/dropdown appearance and playback interactions remain for human visual review. No live GPU upscale was run.
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

author: @codex
created: 2026-08-20 16:33
---
User requested a new follow-up batch covering intermittent upscale output relocation, upscale/tool control consistency, and Selected Generation metadata/playback/comparison corrections.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Follow-up refinement completed for Quick Gen Upscale and Selected Generation. Project output moves are now resilient to transient Windows locks and collision-safe: failed replacements restore the prior project file, successful moves remain successful if old-backup cleanup fails, and failed upscale persistence never creates a project asset pointing at AppData staging. Image/video generation responses now carry the resolved seed into per-take metadata. Video tools reuse the Upscale-style source slot, and image/video Upscale Method controls reuse the model-selector presentation.

Selected Generation now reports decoded final dimensions, active-take seed, zero-padded mm:ss generation time, upscale-aware title and method, click-to-play/pause, default-on loop control, and correct A/B orientation; Copy Prompt was removed. Focused frontend/native tests, backend seed tests, TypeScript/Python checks, production renderer/main/preload build, diff check, and independent review passed. Electron visual QA was inconclusive because no controllable Electron inspection surface was available; no live GPU upscale was performed.
<!-- SECTION:FINAL_SUMMARY:END -->
