---
id: AIVS-005
title: Video Mode 'Tools'
status: Done
assignee:
  - '@Codex'
created_date: '2026-08-02 08:49'
updated_date: '2026-08-02 18:48'
labels: []
dependencies: []
modified_files:
  - backend/WANGP_BACKEND.md
  - backend/api_types.py
  - backend/handlers/video_generation_handler.py
  - backend/services/wangp_bridge.py
  - backend/tests/test_generation.py
  - backend/tests/test_wangp_bridge.py
  - docs/GENSPACE_ARCHITECTURE.md
  - docs/REFRAME_MODE.md
  - frontend/hooks/generation/request-builders.test.ts
  - frontend/hooks/generation/request-builders.ts
  - frontend/hooks/use-generation.ts
  - frontend/types/project.ts
  - frontend/types/video-tools.ts
  - frontend/views/genspace/components/ReframeEditor.tsx
  - frontend/views/genspace/hooks/useGenSpaceController.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/hooks/useGenSpaceGenerationActions.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts
  - frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts
  - frontend/views/genspace/hooks/useGenSpaceVideoTools.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceVideoTools.tsx
  - frontend/views/genspace/logic/generation-assets.test.ts
  - frontend/views/genspace/logic/generation-assets.ts
  - frontend/views/genspace/logic/generation-requests.test.ts
  - frontend/views/genspace/logic/generation-requests.ts
  - frontend/views/genspace/logic/settings-restore.test.ts
  - frontend/views/genspace/logic/settings-restore.ts
  - frontend/views/genspace/types.ts
  - frontend/views/genspace/video/ReframePanel.test.tsx
  - frontend/views/genspace/video/ReframePanel.tsx
  - frontend/views/genspace/video/VideoGenPanel.test.tsx
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - frontend/views/genspace/video/VideoModeTabs.tsx
  - frontend/views/genspace/video/VideoSourceDropZone.tsx
  - frontend/views/genspace/video/VideoToolInput.tsx
  - frontend/views/genspace/video/video-tools.ts
type: feature
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In video mode, please change the 'reframe' tab to 'Tools', and then when in Video > Tools mode, please add a dropdown to select from the following options:

Reframe (existing reframe)
Extend (existing continue video)
Relight
Colorize
Clean Plate
Lip Dub
Decompression
SDR to HDR
Remove Glare
Deblur

The reframe option should of course behave as it does now, as does 'extend' (continue video). All of the other options should also have a single video input option & text prompt. Other than that, the only difference between the 'Tools' is the lora that's assigned to each one:

Relight = https://huggingface.co/buckets/retIbedi/LTX-Loras/resolve/black-magic-ic-lora-450.safetensors

Colorize = https://huggingface.co/buckets/retIbedi/LTX-Loras/resolve/ltx-2.3-22b-ic-lora-colorization-0.9.safetensors

Clean Plate = https://huggingface.co/buckets/retIbedi/LTX-Loras/resolve/ltx-2.3-22b-ic-lora-clean-plate-1.0.safetensors

Lip Dub = https://huggingface.co/buckets/retIbedi/LTX-Loras/resolve/ltx-2.3-22b-ic-lora-lipdub-0.9.safetensors

Decompression = https://huggingface.co/buckets/retIbedi/LTX-Loras/resolve/ltx-2.3-22b-ic-lora-decompression-0.9.safetensors

SDR to HDR = https://huggingface.co/buckets/retIbedi/LTX-Loras/resolve/ltx-2.3-22b-ic-lora-hdr-0.9.safetensors

Remove Glare = https://huggingface.co/buckets/retIbedi/LTX-Loras/resolve/lens-remover-ltx23-ic-lora.safetensors

Deblur = https://huggingface.co/buckets/retIbedi/LTX-Loras/resolve/ltx-2.3-22b-ic-lora-deblur-0.9.safetensors
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Video process tabs show Generate, Tools, and disabled Retake; Tools opens with Reframe selected.
- [x] #2 Tools selector lists Reframe, Extend, Relight, Colorize, Clean Plate, Lip Dub, Decompression, SDR to HDR, Remove Glare, and Deblur.
- [x] #3 Reframe preserves existing trim, aspect, zoom, pan, prompt, request mapping, and generation behavior.
- [x] #4 Extend accepts one video plus text prompt and preserves existing Continue Video extension request and duration behavior.
- [x] #5 Each LoRA-backed tool accepts one video plus text prompt and submits the exact task-specified LoRA URL through the curated WanGP video request path.
- [x] #6 Backend rejects unknown tool IDs and missing tool video inputs without invoking WanGP.
- [x] #7 Generated tool assets persist selected tool and source input; Copy Settings restores Tools mode, selection, prompt, settings, and source.
- [x] #8 Focused frontend/backend tests, TypeScript, Pyright, full frontend/backend suites, and frontend build pass, except explicitly documented pre-existing failures.
- [x] #9 Current Reframe and GenSpace architecture documentation reflects Video Tools ownership and backend mapping.
- [x] #10 Non-Reframe Tools use the same source-video drop zone and trim interaction as Video Reframe.
- [x] #11 After source selection, every non-Reframe Tool uses the persistent Video Reframe preview/transport/trim layout with no secondary thumbnail or Confirm button; only the preview X removes the source, and the header exposes Resolution without Reframe aspect/zoom/reset controls.
- [x] #12 Every non-Reframe Tool except Extend shows auto duration and submits the selected trim length; Extend keeps manual extend-by duration while preserving source trim metadata.
- [x] #13 IC-LoRA Video Tools submit `guidance_phases=2` and an empty `loras_multipliers`, matching the proven WanGP request contract.
- [x] #14 Every LTX generation request uses WanGP `config="PrunaAI VAE"`.
- [x] #15 Every Video Tools mode starts with prompt enhancement disabled by default.
- [x] #16 Video Tools are selected through wrapped chips directly below the Video mode tablist; the dropdown selector is removed and the active Tool chip uses the Video accent.
- [x] #17 One loaded source video, including trim and native path, remains available when switching between Reframe and every other Video Tool in either direction.
- [x] #18 Video Reframe sizes its canvas to the selected output aspect so the target frame fills available width without side gutters; source-only Video Tools retain source-aspect sizing, and video playback/trim behavior remains unchanged.
- [x] #19 Switching between Reframe and any other Video Tool preserves one mounted source editor/media element, avoiding panel flicker while retaining source URL, native path, trim, playback, and approved per-tool UI.
- [x] #20 After repeated Reframe-to-Tool-to-Reframe switches, Reframe keeps its rounded bordered canvas, controls, overlay, and working zoom slider; switching back to source-only Tools keeps compact source-aspect framing with rounded canvas and no excess vertical padding.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria are satisfied
- [ ] #2 Relevant automated tests pass
- [ ] #3 Lint, type-check, and build checks pass where applicable
- [ ] #4 Documentation is updated where required
- [ ] #5 Implementation summary and verification evidence are recorded
- [ ] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Persistent Video Tools host follow-up:
1. Route Reframe and all source-only Video Tools through one stable VideoToolInput/ReframePanel tree position; expose only existing Reframe state/reset callbacks needed by that host, while leaving Retake separate.
2. Keep Tool-specific role, header, aspect/framing controls, padding, source import, trim, playback, and duration behavior unchanged; remove obsolete split Reframe render path.
3. Add a VideoGenPanel regression that switches Reframe to another Tool and back and asserts the same video DOM node remains mounted with source/trim state intact.
4. Update GenSpace/Reframe ownership docs and project memory, then run focused Vitest, strict TypeScript, production build, full frontend suite, and git diff checks.

Preserve mounted media dimensions during layout-only Tool resets; verify Reframe overlay/zoom and source-only aspect after repeated switches.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Kept internal `reframe` process value for saved-state compatibility while relabelling it Tools. Reframe keeps its existing command path. Extend uses `continue_video`; remaining typed tools use one `control_video` and backend-owned exact LoRA URLs/settings. Tool/source metadata is captured in immutable submission snapshots and restored through Copy Settings. Real WanGP GPU generation and native Electron interaction remain reviewer smoke checks.

Human-review follow-up extracted Video Reframe's empty-state uploader into shared `VideoSourceDropZone` and reused it for every non-Reframe Tool. Reframe keeps native-dialog/drop path handling; Tools keep existing project import plus GuideMediaTrimEditor behavior after source selection. Verification: strict TypeScript passed; seven focused frontend suites passed (39 tests); frontend production build passed; `git diff --check` passed.

Latest review pass replaces the non-Reframe compact GuideMediaTrimEditor/CroppableMediaInputSlot composition with ReframePanel/ReframeEditor source-only mode. Project import remains owned by VideoToolInput; persistent preview, transport, trim, X removal, and Resolution header are shared, while frame overlay/aspect/reset/zoom/pan remain Reframe-only.

Tool sources now retain native paths beside display URLs, preventing Asset Library URLs from being dropped before request serialization. Non-Extend Tools display and submit trim-derived auto duration; Extend retains manual extend-by duration while forwarding its source trim.

Direct WanGP manifest evidence corrected the IC-LoRA contract: after shared trim/crop materialization, the handler keeps the effective clip only as `control_video_path`, and the bridge emits `video_guide` with `video_prompt_type=VG`. `video_source` and `image_prompt_type` remain unset. Reframe remains guide-only; Extend remains source-only.

Final runtime correction matches direct WanGP evidence: IC-LoRA `guidance_phases=2`, empty `loras_multipliers`, guide-only clip routing, and shared `PrunaAI VAE` config for every current LTX video submission including Director.

Prompt enhancement now has separate standard and Video Tools preferences. Tools defaults off on mode entry and Tool changes without overwriting standard Generate/Image preference.

Final UI refinement: VideoModeTabs now owns the wrapped accessible Tool chip group immediately below the process tabs; VideoGenPanel no longer renders a dropdown.

Source-state refinement: toolInput is canonical across every Tool. Reframe synchronizes source URL/native path/trim into it and restores those values when re-entered, while aspect/padding remain Reframe-owned.

Verification: focused chip/source tests passed 10/10; expanded Video Tools suites passed 45/45 across nine files; strict TypeScript passed; renderer, Electron main, and preload production builds passed; targeted diff/whitespace checks passed. Full frontend ran 176 passing tests with five documented unrelated baseline failures tracked by AIVS-005.01.

Video/Image Reframe parity follow-up: Video Reframe now passes the source media aspect ratio into the shared ReframeEditor, uses frameInset=0, removes fixed aspect-video/max-height sizing, adopts px-4/py-3 section spacing, and keeps playback/trim controls below the canvas. Focused ReframePanel tests pass 4/4; strict TypeScript passes via local tsc; production renderer/Electron/preload build passes; git diff --check passes. Full frontend: 177 passed, with the same five unrelated baseline failures tracked by AIVS-005.01. Native Electron visual review remains reviewer validation.

Second Reframe parity refinement: framing-enabled Video Reframe now derives canvas aspect from the selected output preset, so a 16:9 target fills the full canvas even when source video is 15:8. Source-only Video Tools retain source-aspect sizing; custom legacy Reframe falls back to source aspect. Focused ReframePanel tests pass 4/4, strict TypeScript passes, renderer/Electron/preload builds pass, and git diff --check passes. Full frontend remains 177 passed with the same five unrelated failures tracked by AIVS-005.01.

Persistent-host follow-up: VideoGenPanel now renders every Video Tool through one stable VideoToolInput/ReframePanel tree position. Reframe changes framing controls in place; source-only Tools keep approved UI. ReframePanel resets only when resetKey changes, preventing live parent prop updates from clearing dimensions or trim state. Verification: 48/48 focused tests across nine Video Tools/request/restore suites; node node_modules/typescript/bin/tsc --noEmit passed; node node_modules/vite/bin/vite.js build passed for renderer, Electron main, and preload; git diff --check passed. Full frontend: 179 passed with the same five unrelated failures tracked by AIVS-005.01. Native Electron visual smoke check remains for reviewer.

Post-switch regression fix: ReframePanel resetKey now preserves videoWidth/videoHeight because VideoToolInput keeps the source video element mounted; this restores Reframe overlay/border and zoom interaction and keeps source-only tools on source aspect.

Verification: VideoGenPanel regression plus Reframe/Editor/Video Tools suites pass (23 tests); strict TypeScript passes; Vite renderer/Electron/preload build passes; git diff --check passes. Full frontend: 180 passing, five documented unrelated baseline failures remain in GenSpaceModeTabs, ImageEditMediaInputs, RegionPromptEditor, and MusicSettings.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: User
created: 2026-08-02 10:00
---
Human review feedback: all Video Tools source-video drop zones must use the same implementation and presentation as Video Reframe.
---

author: User
created: 2026-08-02 10:19
---
Human review feedback: non-Reframe Tools must match the full Video Reframe source layout after selection—persistent preview, transport and trim, top-right X removal, no secondary thumbnail or Confirm button, Resolution in header, and no Reframe-specific aspect/zoom/reset controls.
---

author: User
created: 2026-08-02 10:28
---
Additional human-review feedback: all Video Tools except Extend must use auto duration derived from selected trim length; Extend keeps its existing manual extension duration.
---

author: User
created: 2026-08-02 10:34
---
Additional human-review defect: LoRA-backed Tools currently reject a visibly selected video with `You must provide a Source Video file to continue`; selected source path must survive UI state and request compilation.
---

author: User
created: 2026-08-02 10:56
---
Human-review defect persists: LoRA-backed Tools still return `You must provide a Source Video file to continue`. User observed Reframe/Extend create a temporary output clip for WanGP while the other Tools do not.
---

author: User
created: 2026-08-02 11:04
---
WanGP manifest evidence supplied by user: IC-LoRA works with `image_prompt_type=''`, `video_source=null`, and only `video_guide` plus `video_prompt_type='VG'`. Remove the unnecessary source-video routing and erroneous `V` flag.
---

author: Codex
created: 2026-08-02 11:05
---
Correction scope confirmed from direct WanGP manifest supplied by user: IC-LoRA tools require `video_prompt_type="VG"` and `video_guide`; `video_source` must remain null and `image_prompt_type` empty.
---

author: User
created: 2026-08-02 11:23
---
Human-review runtime feedback: IC-LoRA output is incorrect with `guidance_phases=1` and `loras_multipliers="1"`; match direct WanGP values `2` and empty string. Also set `config="PrunaAI VAE"` for all LTX generations and default prompt enhancement off in every Video Tools mode.
---

author: User
created: 2026-08-02 11:53
---
Human-review refinement: replace Video Tool dropdown with wrapped chips below the Video mode tablist, matching supplied reference. Unify Reframe and non-Reframe source state so one loaded video survives all Tool switches.
---

author: User
created: 2026-08-02 12:37
---
Human-review feedback: Video Reframe must match Image Reframe’s panel padding, canvas sizing/framing, and interaction behavior by reusing the Image Reframe approach where practical.
---

author: User
created: 2026-08-02 13:04
---
Human-review feedback: Video Reframe still letterboxes the selected target frame inside the source-aspect canvas. Desired result fills available canvas at the selected output aspect; source-only Video Tools already look correct and must remain unchanged.
---

author: User
created: 2026-08-02 13:08
---
Human-review follow-up: Video Reframe visibly flickers when switching to/from other Video Tools. Keep one persistent Video Tools panel host, matching Image Edit mode switching behavior; other Video Tool layouts must remain unchanged.
---

author: User
created: 2026-08-02 13:33
---
Human-review regression: persistent host removed flicker but switching Reframe -> another Tool -> Reframe loses canvas border/rounding and disables zoom; switching back leaves source-only Tools with oversized top/bottom padding and lost rounding. Preserve one mounted media element while resetting layout-only editor state on mode transitions.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented complete Video Tools workflow under Video > Tools, including Reframe, Extend, eight curated IC-LoRA tools, persisted tool/source settings, Copy Settings restoration, source trim handling, backend validation, exact WanGP guide/LoRA mapping, PrunaAI VAE enforcement, Tool-specific prompt-enhancement defaults, wrapped Tool chips, and canonical source handoff across every Tool.

Final Reframe UI refinement removes remaining side gutters: framing-enabled Video Reframe sizes its canvas to the selected output aspect, allowing the target frame to fill available width at zero inset even when source and output aspects differ. Source-only Video Tools remain source-aspect and retain their approved layout. Video playback, mute, transport, trim, zoom, pan, persistence, and generation mapping remain unchanged.

Verification: focused ReframePanel tests 4/4 passed with an explicit 15:8-source/16:9-output mismatch; expanded Video Tools frontend tests 45/45 passed earlier in this task; strict TypeScript passed; renderer, Electron main, and preload production builds passed; focused/affected backend tests, full 314-test backend suite, and Pyright passed during backend validation; git diff --check passed. Full frontend currently reports 177 passing tests and five documented unrelated baseline failures tracked by AIVS-005.01. Exact native Electron visual parity and real WanGP GPU output remain human smoke checks.

Follow-up removes Video Tool switch flicker by keeping one mounted source editor and video DOM node across Reframe, Extend, and IC-LoRA Tools. Regression coverage proves DOM identity, source URL, trim, and per-tool headers survive Reframe to Relight to Reframe switching. Focused 48/48, strict TypeScript, production builds, and diff checks pass; full frontend has 179 passing tests plus five known unrelated baseline failures.
<!-- SECTION:FINAL_SUMMARY:END -->
