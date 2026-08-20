---
id: AIVS-016
title: Redesign Quick Gen mode and tool navigation
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-19 16:04'
updated_date: '2026-08-20 16:33'
labels:
  - frontend
  - quick-gen
  - ux
dependencies: []
modified_files:
  - backend/model_profiles/audio_profiles.py
  - backend/services/wangp_bridge.py
  - backend/tests/test_speech_generation.py
  - backend/tests/test_wangp_bridge.py
  - backend/wangp_model_packs.py
  - electron/python-setup.ts
  - frontend/views/genspace/GenSpaceModeTabs.tsx
  - frontend/views/genspace/GenSpaceSidebar.tsx
  - frontend/views/genspace/audio/SfxMediaInputs.tsx
  - frontend/views/genspace/audio/SpeechGenPanel.tsx
  - frontend/views/genspace/components/GenSpaceControls.test.tsx
  - frontend/views/genspace/components/MediaInputSlot.tsx
  - frontend/views/genspace/components/ReferenceAddButton.tsx
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/image/ImageEditMediaInputs.tsx
  - frontend/views/genspace/image/ImageGenPanel.tsx
  - frontend/views/genspace/image/ImageMediaInputs.tsx
  - frontend/views/genspace/image/ImageModeTabs.tsx
  - frontend/views/genspace/music/MusicMediaInputs.tsx
  - frontend/views/genspace/music/MusicPromptControls.tsx
  - frontend/views/genspace/types.ts
  - frontend/views/genspace/video/VideoMediaInputs.tsx
  - frontend/views/genspace/workflows.test.ts
  - frontend/views/genspace/workflows.ts
priority: medium
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rework Quick Gen navigation so media types and favourite workflows are immediately accessible from a left sidebar, while the full mode/tool catalogue opens over the prompt workspace. Mode and tool choices become authoritative for curated model compatibility: choosing a workflow keeps the current model when compatible and otherwise selects a supported model. Move the existing LTX Styles entry into the media-input area without changing style generation behaviour.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Image, Video, and Audio are presented as accessible icon buttons in a sidebar immediately left of the prompt area, with the active media type clearly indicated.
- [x] #2 The current mode/tool is presented as a prominent button; activating it opens a catalogue that temporarily replaces or overlays the prompt area and selecting an entry closes the catalogue into that workflow.
- [x] #3 Users can pin or favourite available modes/tools from the catalogue, see them in a labelled sidebar favourites section, launch them directly, and retain favourites across app restarts.
- [x] #4 Selecting a mode/tool keeps the current curated model when it is compatible and otherwise automatically selects a compatible curated model; model selection no longer makes reachable modes/tools unavailable.
- [x] #5 The existing Styles action is removed from the prompt controls and appears in the media-input area for compatible LTX workflows, with existing style selection, compatibility, persistence, and generation behaviour preserved.
- [x] #6 The redesigned controls support keyboard operation, visible focus, useful labels/tooltips, and empty/no-compatible-option states without weakening current generation, Copy Settings, or saved-project behaviour.
- [x] #7 LTX 2.5 reference inputs use the MiniMax H3-style compact reference layout, with Styles immediately left of Add media.
- [x] #8 Music type choices Instrumental, Custom, and Auto are presented as accessible tabs without changing music request behaviour.
- [x] #9 Image, Video, and Audio workflow accents are consistently blue, purple, and green across sidebar favourites, the current tool selector, and catalogue tool icons.
- [x] #10 Every occupied Quick Gen reference-media tile exposes a visible and keyboard-focusable close button; image, video, and audio reference sections show a current reference count.
- [x] #11 Image Create and Image Edit workflows use the shared Add media button instead of empty reference drop areas while preserving gallery, file-picker, drop, role, crop, and removal behavior.
- [x] #12 Right-clicking a favourite opens a context menu with Remove and Re-order actions; Remove unfavourites that workflow, while Re-order explicitly enables drag ordering and shows a tick control that persists the order and exits re-order mode.
- [x] #13 Image Edit is exposed as separate Edit, Retouch, and Reframe workflows that select the existing corresponding image-edit tool state without duplicating generation logic.
- [x] #14 MiniMax H3 displays the Styles media button in the same location as LTX, disabled and non-interactive for now.
- [x] #15 Music language and voice controls are grouped under one microphone-icon menu; BPM, key, and time-signature controls are grouped under one musical-note-icon menu without changing submitted settings.
- [x] #16 The curated Speech option replaces Index TTS 2 with Index TTS 2.5 through the existing WanGP speech path while preserving compatible saved settings where feasible.
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
Human Review follow-up plan:
1. Fix the shared MediaInputSlot wrapper so every occupied reference tile regains its positioned hover/focus remove button; extract and reuse the existing Add media control for image references.
2. Add current/maximum counters to rendered reference sections; expose a disabled H3 Styles tile without opening the modal or setting styleId.
3. Keep the persisted favourites array as the sole order owner. Add a right-click menu with Remove and Re-order; only Re-order mode enables native drag/drop, and a trailing tick button confirms/persists the order and exits.
4. Preserve image:edit and add image:retouch/image:reframe workflow IDs; map all three to existing image edit state and capability-aware model selection.
5. Group music language+voice under a microphone menu and BPM+key+time signature under a musical-note menu without changing request compilation.
6. Preserve stable AiVS ID index_tts2 while replacing its display/runtime mapping with WanGP index_tts25 and AB2 dialogue handling.
7. Run focused interaction/workflow/speech tests, typechecks, frontend build, diff checks, Electron QA, and independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Starting from a dirty dev worktree containing the completed AIVS-012 Styles changes, including ModeSelector.tsx and backend style work. Preserve those edits and keep AIVS-016 changes confined to Quick Gen navigation/settings plus the Styles trigger relocation.

Implemented stable workflow metadata, persisted favourites, controller-owned workflow-to-profile resolution, media/favourites rail, prompt-pane catalogue overlay, and LTX Styles relocation. Verification: pnpm typecheck:ts passed; pnpm typecheck:py passed; workflows and VideoModeTabs focused Vitest files passed 2/2; Styles relocation focused Vitest passed 1 with 12 skipped; backend uv run pytest tests/test_settings.py -q passed 23/23; pnpm build:frontend passed; git diff --check passed. Real Electron QA at 1384x835 passed the media rail, launcher/catalogue overlay, pin shortcut, Escape/focus restoration, disabled no-compatible state, and visible first-position Styles tile/modal. Alternate-model switching could not be observed because only one compatible video model is installed, but current/fallback profile selection and stale-profile submission guards are covered by focused tests and independent review returned ship. Two unrelated pre-existing AIVS-012 Cover Song assertions in the full shared controls file remain outside this task. Existing AIVS-012 worktree edits were preserved.

Human Review refinement implemented with the existing GenSpace accent CSS-variable boundary and a file-local shared Add media button. LTX keeps all existing media/style handlers while rendering large Start/End slots, Styles left of Add media, and occupied guides below. Music retains existing vocal-mode values and capability filtering behind accessible tabs. Verification: pnpm typecheck:ts passed; MusicSettings.test.tsx passed 3/3; targeted LTX references regression passed 1 with 12 unrelated tests skipped; pnpm build:frontend passed for renderer, Electron main, and preload with normal repository read access; git diff --check passed. Actual Electron QA at approximately 1384x835 logical viewport passed LTX layout, Styles modal open/Escape, music mouse/arrow interaction, launcher/favourite accents, and audio catalogue icons. Image/video catalogue tiles were not captured after the QA app lost foreground, but their launchers/favourites were observed and all catalogues share the verified ModeSelector icon path. Independent review verdict: ship. One combined controls run also reproduced two previously documented unrelated Cover Song empty-render fixture failures; no related source was changed.

User requested consolidating the remaining flat .genspace-mode-theme selectors into native CSS nesting after applying the dropzone example.

Human Review CSS nesting follow-up: consolidated all remaining .genspace-mode-theme rules under one native nested scope, grouped tab/button/generate/input/dropzone states under their owning selectors, and preserved the user's dropzone base color plus existing specificity and declarations. Validation: git diff --check passed; pnpm build:frontend passed; emitted production CSS contains the expected 10 expanded GenSpace theme rule groups. No tests were added because this is a behavior-preserving CSS organization refactor. Electron visual smoke was not repeated because emitted selectors/declarations are unchanged by this refactor; the user's pre-existing base dropzone color remains intact.

Follow-up starts from a clean dev worktree. Local Wan2GP dev commit 9eac9c85 confirms Index TTS 2.5 model_type index_tts25 and continued AB2 dialogue semantics; no weight download or live GPU synthesis is in scope.

Final follow-up implementation: restored the shared reference remove affordance; reused one Add media component; added per-section counters; split Edit/Retouch/Reframe through existing edit state and capability-aware profile selection; added disabled H3 Styles; grouped music controls; mapped stable index_tts2 IDs to WanGP index_tts25; and made favourites manageable through an accessible right-click/keyboard menu with explicit persisted reorder confirmation.

Reviewer fix-first findings were resolved: source assignment no longer resets Retouch/Reframe, the reorder tick awaits immediate saveSettings and remains active on rejection, and the context menu supports Shift+F10/Menu, initial focus, arrow/Home/End navigation, Escape, and focus return. Independent re-review verdict: ship.

Verification: pnpm typecheck:ts passed; pnpm typecheck:py passed with 0 errors/warnings; workflows Vitest passed 2/2; focused GenSpace interaction Vitest passed 4/4 plus reviewer regressions 2/2; focused Index TTS backend pytest passed 4/4; pnpm build:frontend passed renderer, Electron main, and preload (existing chunk-size advisory only); git diff --check had only CRLF notices. Full shared controls still has two previously documented unrelated Cover Song fixture failures. No GPU speech generation or model download was run.

Real Electron QA was attempted but blocked: pnpm dev built and served Vite, while three remote-debug Electron launches exited within 6-16 seconds and port 9222 remained refused. No UI interactions or settings were changed during that attempt.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-20 11:11
---
Human Review refinement requested: align LTX references with H3, convert music type to tabs, and apply mode-colour accents consistently across workflow navigation.
---

created: 2026-08-20 15:35
---
Human Review follow-up requested: restore reference removal, add reference counters/Add media consistency, reorder favourites, split image edit workflows, add disabled H3 Styles, consolidate music settings, and replace Index TTS 2 with Index TTS 2.5.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary

- Restored the shared reference-media remove X, added current/max counters across image/video/audio references, and reused one Add media control for image references.
- Added explicit Edit, Retouch, and Reframe image workflows while keeping the existing edit state/generation path and capability-aware installed-model selection.
- Favourite workflows now use a right-click or keyboard context menu for Remove/Re-order. Dragging is enabled only in reorder mode; the trailing tick awaits immediate settings persistence before exit. Keyboard focus and menu navigation are supported.
- Added disabled MiniMax H3 Styles placement, grouped music language/voice and BPM/key/time controls into two icon menus, and replaced the curated Index TTS 2 presentation/runtime with Index TTS 2.5 while preserving stable AiVS profile/pack IDs.

## Verification

- TypeScript and Pyright passed.
- Focused frontend workflow/interactions passed: 2 workflow tests, 4 core interaction tests, and 2 reviewer regression tests.
- Focused backend speech/IndexTTS tests passed 4/4.
- Renderer, Electron main, and preload production builds passed; only the existing chunk-size advisory remained.
- Independent correction re-review verdict: ship; diff check clean apart from Windows line-ending notices.

## Runtime limits

- Real Electron visual QA was attempted but the new Electron process exited before remote control became available; no visual criteria were exercised in that final pass.
- No Index TTS 2.5 weight download or live GPU speech generation was performed.
<!-- SECTION:FINAL_SUMMARY:END -->
