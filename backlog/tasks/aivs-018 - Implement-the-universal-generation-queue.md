---
id: AIVS-018
title: Implement the universal generation queue
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-20 20:55'
updated_date: '2026-08-21 15:39'
labels: []
dependencies: []
documentation:
  - docs/AI-Video-Studio-Generation-Queue-Implementation-Plan.md
modified_files:
  - backend/api_types.py
  - electron/ipc/app-handlers.ts
  - electron/main.ts
  - electron/preload.ts
  - electron/window.ts
  - frontend/App.tsx
  - frontend/components/AppTitleBar.tsx
  - frontend/components/GenerationQueuePanel.tsx
  - frontend/components/GenerationQueuePanel.test.tsx
  - frontend/components/GenerationQueuePopover.tsx
  - frontend/components/ModelDropdownTrigger.tsx
  - frontend/components/SeedControl.tsx
  - frontend/components/SettingsModal.tsx
  - frontend/components/SidebarUtilityButtons.tsx
  - frontend/contexts/GenerationQueueContext.tsx
  - frontend/hooks/use-generation.ts
  - frontend/hooks/use-generation.test.tsx
  - frontend/hooks/use-retake.ts
  - frontend/index.css
  - frontend/views/Home.tsx
  - frontend/views/Project.tsx
  - frontend/views/genspace/GenSpaceGallery.tsx
  - frontend/views/genspace/GenSpaceModeTabs.tsx
  - frontend/views/genspace/components/FramingControl.tsx
  - frontend/views/genspace/components/GenSpaceControls.test.tsx
  - frontend/views/genspace/components/PresetPromptPicker.tsx
  - frontend/views/genspace/components/PromptActions.tsx
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/image/ImageGenPanel.tsx
  - frontend/views/genspace/music/MusicGenPanel.tsx
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - shared/electron-api.ts
priority: high
type: feature
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a persistent backend-owned generation queue so users can submit mixed image, video, music, speech, SFX, upscale, retake, reframe, and Director work while generation is active, with global visibility and project-safe result recovery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All output-producing generation operations are admitted to one canonical backend queue and execute serially in FIFO order by default.
- [x] #2 Queued jobs can be moved or removed while pending, the active job can be cancelled, and a failed or cancelled job does not block later jobs.
- [x] #3 Submission is asynchronous, idempotent by client request ID, capacity-limited, and preserves immutable validated payload and client persistence context.
- [x] #4 Queue state is atomically persisted, queued work resumes after restart, active work becomes interrupted, and completed unacknowledged results remain recoverable.
- [x] #5 A global renderer queue surface shows active, pending, and recent terminal work with accessible reorder, remove, cancel, retry-attention, and dismiss or acknowledgement behavior.
- [x] #6 Generation results persist exactly once to the originating project and are acknowledged only after project persistence succeeds.
- [x] #7 No direct backend or frontend generation lifecycle bypass remains after migration, and WanGP remains the sole serial local inference runtime.
- [ ] #8 Focused backend and frontend queue contracts, TypeScript and Python type checks, the frontend production build, and one real mixed-queue Electron smoke scenario provide completion evidence.
- [ ] #9 Quick Gen replaces the toolbar queue popover with an accessible queue panel below the Asset Library; its active row can be selected into Selected Generation with live preview and complete progress detail.
- [ ] #10 Queue rows show media type, operation mode, truncated prompt when relevant, model and available duration/aspect/resolution/upscale metadata, plus the first image reference thumbnail or a media-type icon.
- [ ] #11 The Quick Gen navigation rail places a persistent light/dark toggle above Settings; the standalone Log button is removed and Logs is available as an embedded Settings tab.
- [ ] #12 Resolution, aspect-ratio, and duration controls sit below the prompt editor while prompt actions remain in the editor; Enhance, Seed, Camera, model icons, music keyword chips, and camera preset chips remain visible in light and dark themes.
- [ ] #13 The native File/Edit/View/Window menu is removed; a theme-aware custom title bar preserves native window controls; app-wide F5 reloads, Shift+F5 force reloads, and F12 toggles DevTools.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [x] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Build backend queue contracts, canonical lifecycle, revisioned atomic store, idempotent admission, capacity handling, recovery conversion, retention, and focused pure lifecycle tests. Persist admission before returning 202; persist claims before dispatch; stop the queue as unhealthy if a required lifecycle save fails.
2. Add a job-scoped execution context and refactor image, video/tools, retake, Director, music, SFX, speech, and upscale handlers into worker-invoked execution methods. Keep preprocessing and cleanup with each domain; keep WanGP as the serial executor; bind every progress, cancellation, and terminal mutation to the active job ID.
3. Add the single worker/executor, runtime-ready gate, and explicit shutdown lifecycle. Prompt enhancement and lyric composition remain synchronous v1 helpers but must acquire or consult the same inference-lane ownership and return a clear busy response.
4. Add typed queue HTTP admission/list/detail/reorder/remove/cancel/acknowledgement routes and atomically cut all legacy generation routes over to queue-backed behavior without any direct execution path or response-contract mismatch.
5. Add one global GenerationQueueProvider/API client and accessible queue popover in App. It owns the only queue poller and exposes active, pending, recent terminal, reorder, remove, cancel, attention, and dismiss state.
6. Convert Quick Gen, Director, Retake, and Video Editor submission paths into immutable queued drafts. Preserve existing request builders, stable project/asset IDs, and compatible profile behavior; remove mutable submission refs and the independent useGenerationJob lifecycle. Generate remains enabled for valid submissions while work is active.
7. Extract modality-specific persistence into global job-ID-scoped result consumers. Copy outputs while unacknowledged, deduplicate by durable job/output provenance, wait for the exact ProjectPersistenceQueue save to resolve, validate complete output-index coverage with a generic receipt, then acknowledge; clean staging only after acknowledgement.
8. Remove obsolete global progress/cancel state and compatibility code, update enduring architecture documentation/project map, inspect all bypass searches and the complete diff, then run focused backend/frontend queue tests, TypeScript and Python type checks, frontend build, independent review, and an Electron mixed-queue/restart smoke when the runtime is available.

9. Replace GenerationQueuePopover with a reusable Quick Gen queue panel under GenSpaceGallery. Extend the durable summary with compact optional model/badge/reference-thumbnail display fields at existing admissions; adapt the active queue snapshot into the existing Selected Generation preview/progress contract without changing provider ownership or durable execution semantics.

10. Move Settings and a direct AppSettingsContext light/dark toggle into GenSpaceModeTabs, remove standalone queue/log/settings shell buttons, embed the existing LogViewer as a Settings tab, and keep backend connection/restart status in app chrome.

11. Keep prompt actions inside PromptEditor but compose resolution/aspect/duration controls immediately below it in the image/video/music panels. Correct only the low-contrast semantic classes for PromptActions, SeedControl, FramingControl presets/trigger, ModelDropdownTrigger, and PresetPromptPicker chips.

12. Remove Electron's application menu, use a hidden title bar with native window-controls overlay, add a shallow theme-aware renderer title bar, synchronize overlay colors through one narrow typed IPC, and register a coordinate-gated native title-bar context menu for reload/force reload/devtools.

13. Validate with TypeScript, the focused queue/selected-generation/settings/control tests, a frontend production build, complete diff review, independent review, and a real Electron smoke covering queue selection, both title-bar themes, native controls, and title-bar context actions.

14. Replace the unreliable title-bar context menu with main-process before-input-event shortcuts: F5 reload, Shift+F5 reloadIgnoringCache, and F12 toggleDevTools. Prevent the renderer default only for these exact combinations, remove the unused native context-menu code, then run strict TypeScript and the frontend/Electron production build.

15. Compact queue rows by removing the redundant summary label and placing the model plus existing metadata chips on the media/mode line. Replace visible arrow controls with a native drag handle beneath each queued media icon while retaining focused ArrowUp/ArrowDown keyboard reordering. Normalize nullable backend progress fields at the queue contract and only format complete numeric step/phase/section pairs, then verify the focused queue interaction test, strict TypeScript, production frontend build, diff inspection, and independent review.

16. Address review evidence gaps with the existing focused queue test: cover last-to-first drag ordering with three jobs, and add the smallest pure progress-detail regression proving nullable counter pairs are omitted while a complete numeric pair is retained. Re-run only the affected focused test and strict TypeScript, then obtain a fresh review.

17. Move the existing backend connection/restart control from App chrome into the shared SidebarUtilityButtons above theme and Settings. Refactor ConnectionIndicator into one refresh-icon button that retains the existing ready/launching/disconnected derivation and restart-plus-health-retry behavior, uses state-colored backgrounds, exposes the status text through title/aria-label, and removes the obsolete fixed App control. Validate strict TypeScript, the production frontend/Electron build, targeted diff inspection, and a focused static/accessibility review; use live Electron visual QA only if a visible surface is available.

18. Harden the moved restart control after independent review: publish and consume the shared restarting lifecycle state, coalesce restart requests in BackendLifecycleContext and electron/python-backend, derive connection presentation from live lifecycle values so a late bridge connection clears timeout state, and cover restart/busy/timeout transitions in one focused component test.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Current dev is two commits beyond the plan snapshot. The implementation must additionally cover DirectorWorkspacePanel and Video Editor useGapGeneration/useRegeneration persistence lanes, plus the separate use-retake hook.

Architecture commitment check required durability at lifecycle commit points, copy-not-move handling for unacknowledged outputs, complete generic acknowledgement receipts, an exact project-save await boundary, and an atomic legacy-route cutover.

Frontend mapping settled: mount one GenerationQueueProvider/result consumer inside ProjectProvider; use FloatingMenu for the toolbar popover; add optional job/output provenance to Asset and AssetTake; add a narrow copy-preserving generated-output IPC; add waitForPersistedRevision/awaitProjectPersistence instead of acknowledging after React mutation.

Existing useGapGeneration mixes submitted projectId for file copy with mutable currentProjectId for addAsset. Projectmem issue #0152 records this cross-project risk; AIVS-018 immutable job context must resolve it.

Backend queue slice implemented: canonical AppState-attached revisioned queue/store/worker, job-scoped GenerationHandler compatibility, readiness/shutdown/recovery, generic queue API, queue-backed legacy routes, helper-lane protection, typed complete-output acknowledgements, and bounded terminal pruning.

Backend evidence: `rtk uv run --offline pytest tests/test_generation_queue.py -q` 6 passed; `pnpm typecheck:py` 0 errors/warnings; `git diff --check` clean apart from CRLF conversion warnings. Live WanGP/GPU validation remains pending.

Implemented the universal generation queue end to end: durable atomic backend admission/claim/terminal/ack state; one FIFO worker and shared helper lane; queue-backed legacy adapters; global adaptive-polling renderer queue; immutable project-scoped submissions; modality-specific exactly-once result persistence; source-preserving output copy; exact project-save acknowledgement; provenance dedupe; accessible queue controls; and removal of the old renderer lifecycle.

Verification: backend queue tests `rtk uv run --offline pytest tests/test_generation_queue.py -q` passed 15/15; `pnpm typecheck:py`, `pnpm typecheck:ts`, `pnpm test:media-import`, `pnpm build:frontend`, `git diff --check`, and five focused frontend files (19/19 tests) passed. Production direct-output endpoint inventory found no bypasses.

Electron evidence: supported `pnpm dev` launched the real Electron app, authenticated backend, RTX 4070 Ti SUPER runtime, and WanGP preload successfully. A separate isolated Electron/CDP launch confirmed the preload bridge and global queue button rendered.

Remaining acceptance evidence: AC #8 explicitly requires a real interactive mixed-queue Electron scenario; that exact scenario was not run, so the task remains In Progress. The full frontend suite has 12 unchanged baseline failures across six unrelated files (248 tests passed), and the full backend suite was interrupted after producing no output; neither is represented as passing.

2026-08-21 UI follow-up implemented. Replaced the toolbar queue popover with a bounded panel below the Quick Gen Asset Library; active queue work is selectable into the existing Selected Generation surface with preview, status, percent and phase/step/section detail. Durable summaries now carry optional model, badges and first-image-reference thumbnail fields, with explicit accessible media type and mode labels. Queue ownership and polling remain global.

Moved shared theme/Settings utilities to the bottoms of the Quick Gen and Home navigation sidebars, embedded the existing LogViewer as a Settings Logs tab, removed the standalone Log and queue shell buttons, moved applicable duration/resolution/aspect controls below prompt editors, and corrected the requested semantic contrast classes.

Removed the native application menu and added a 34px theme-aware renderer title bar with native window-controls overlay. A narrow validated IPC synchronizes overlay colors; a titlebar-coordinate-gated native menu exposes Reload, Force Reload and Toggle DevTools.

Final verification after review fixes: pnpm typecheck:ts passed; pnpm typecheck:py passed; backend queue pytest tests/test_generation_queue.py passed 15/15; focused queue/use-generation/settings tests passed 5/5; the earlier broader focused queue/context/selected-generation/settings run passed 15/15; pnpm build:frontend passed; git diff --check passed apart from normal LF-to-CRLF notices. Independent code review verdict: ship, no findings. Two unrelated pre-existing GenSpaceControls MusicMediaInputs fixture failures remain tracked in projectmem #0183.

Electron visual QA launched pnpm dev, but the session exposed neither a desktop window nor CDP target, so rendered light/dark inspection, active-generation click-through and native titlebar context-menu validation could not be performed. AC8 and AC13 therefore remain open and AIVS-018 stays In Progress pending a human-visible real Electron mixed-queue/titlebar smoke.

2026-08-21 shortcut follow-up: user confirmed the title-bar context menu did not appear and replaced that interaction with keyboard shortcuts. `electron/window.ts` now intercepts exact, non-repeating main-process keyDown events: F5 calls `reload()`, Shift+F5 calls `reloadIgnoringCache()`, and unmodified F12 calls `toggleDevTools()`. The obsolete native context-menu handler and Menu import were removed.

Shortcut verification: `pnpm typecheck:ts` passed; `pnpm build:frontend` passed for renderer, Electron main, and preload bundles; targeted diff check passed apart from normal LF-to-CRLF notices. Independent review verdict: ship, no findings. AC13 remains unchecked until the shortcuts are exercised in a human-visible Electron window.

Independent review returned fix-first: implementation shape is sound, but focused coverage must prove upward native drag ordering and null-safe progress-detail formatting before acceptance.

2026-08-21 compact-queue feedback implemented: rows now use 32px media thumbnails, tighter vertical padding, one inline media/mode plus model/metadata chip line, no redundant summary label, and a three-line native drag handle below queued media. The handle also supports ArrowUp/ArrowDown keyboard reordering. Queue progress types now reflect nullable backend JSON, and getQueueProgressBadges emits only complete numeric pairs before Selected Generation renders them.

Focused verification: `pnpm exec vitest run frontend/components/GenerationQueuePanel.test.tsx frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx` produced 6/6 passing tests (the queue file was rerun after its fixture correction and passed 1/1); `pnpm typecheck:ts` passed; `pnpm build:frontend` passed for renderer, Electron main, and preload outside the Windows read-restricted sandbox; targeted `git diff --check` passed apart from normal LF-to-CRLF notices. Fresh independent rereview verdict: ship, no findings. Live Electron/Chromium physical drag and compact-layout validation remains outstanding, so the overall AIVS-018 task stays In Progress with AC8/9/10 not marked complete.

Verification clarification: the combined two-file Vitest run passed all five Selected Generation tests but initially failed the queue test because the newly added third fixture made an existing model-text query ambiguous. After scoping that query and updating three-job expectations, the final `pnpm exec vitest run frontend/components/GenerationQueuePanel.test.tsx` rerun passed 1/1. No Selected Generation production or test code changed after its five tests passed. Strict TypeScript and the full frontend/Electron/preload production build then passed on the final source.

2026-08-21 backend-sidebar follow-up implemented. The old fixed App connection/status cluster is removed; SidebarUtilityButtons now renders one status-colored refresh button above theme and Settings. Its native hover title reports Ready, Launching n/2, or Disconnected, and its accessible name includes the restart action. The button uses emerald/amber/red backgrounds and retains keyboard focus and busy semantics.

Independent review found two lifecycle risks from moving the control between remounting sidebars. The correction makes restart state provider-owned, coalesces renderer and Electron-main restart requests, publishes the existing restarting state before shutdown, and derives display state from live bridge/process/model values so a bridge arriving after the 60-second timeout immediately returns to Launching rather than staying red.

Verification: `pnpm exec vitest run frontend/components/ModelStatusDropdown.test.tsx` passed 3/3; `pnpm exec tsc --noEmit --noUnusedLocals false --noUnusedParameters false` passed; `pnpm build:frontend` passed outside the Windows read-restricted sandbox for renderer, Electron main, and preload; targeted `git diff --check` passed apart from LF-to-CRLF notices. Normal `pnpm typecheck:ts` remains blocked only by unrelated concurrent unused imports in AppTitleBar.tsx (`AivsLogo`) and GenerationQueuePanel.tsx (`ListOrdered`), tracked as projectmem #0198. Live visual Electron validation remains outstanding.

Fresh correction review verdict: ship, no findings. Reviewer confirmed renderer/main restart coalescing, shared busy state, timeout recovery, and promise cleanup; only residual is the unchanged one-second port-release delay.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-21 09:46
---
User added native-menu removal and a custom title bar with title-bar context actions to this same requested UI pass on 2026-08-21.
---

author: @codex
created: 2026-08-21 11:01
---
User confirmed the custom title bar looks good but the native right-click menu does not appear. They explicitly replaced that interaction with F5, Shift+F5, and F12 shortcuts on 2026-08-21.
---

author: @codex
created: 2026-08-21 12:16
---
User feedback on 2026-08-21 requests more compact queue rows, model-as-chip placement, drag-handle reordering instead of visible arrows, and removal of `null/null` progress details from Selected Generation.
---

author: @codex
created: 2026-08-21 15:24
---
User requested on 2026-08-21 that backend connection/restart move to the bottom navigation sidebar above the theme switch and become a single status-colored refresh button with status tooltip.
---
<!-- COMMENTS:END -->
