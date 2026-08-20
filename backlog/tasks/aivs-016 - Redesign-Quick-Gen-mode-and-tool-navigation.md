---
id: AIVS-016
title: Redesign Quick Gen mode and tool navigation
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-19 16:04'
updated_date: '2026-08-20 13:50'
labels:
  - frontend
  - quick-gen
  - ux
dependencies: []
modified_files:
  - frontend/views/genspace/video/VideoMediaInputs.tsx
  - frontend/views/genspace/music/MusicSettings.tsx
  - frontend/views/genspace/music/MusicSettings.test.tsx
  - frontend/views/genspace/components/ModeSelector.tsx
  - frontend/views/genspace/GenSpaceModeTabs.tsx
  - frontend/views/genspace/components/GenSpaceControls.test.tsx
  - frontend/index.css
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
1. Reuse the existing H3 compact reference/add-media presentation for compatible LTX inputs while keeping Styles state and ordering intact. 2. Present the existing music type state as accessible tabs without changing compilation or persistence. 3. Centralize the existing media-kind accent classes in the workflow presentation layer and apply them to favourites, current-workflow launcher, and catalogue icons. 4. Run TypeScript/build checks, inspect the complete diff, smoke the changed Electron UI, and obtain independent review.

Human Review CSS follow-up: preserve the user's nested dropzone rule, nest the remaining .genspace-mode-theme selectors without changing computed selector behavior, then inspect the focused diff and run git diff --check plus the frontend build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Starting from a dirty dev worktree containing the completed AIVS-012 Styles changes, including ModeSelector.tsx and backend style work. Preserve those edits and keep AIVS-016 changes confined to Quick Gen navigation/settings plus the Styles trigger relocation.

Implemented stable workflow metadata, persisted favourites, controller-owned workflow-to-profile resolution, media/favourites rail, prompt-pane catalogue overlay, and LTX Styles relocation. Verification: pnpm typecheck:ts passed; pnpm typecheck:py passed; workflows and VideoModeTabs focused Vitest files passed 2/2; Styles relocation focused Vitest passed 1 with 12 skipped; backend uv run pytest tests/test_settings.py -q passed 23/23; pnpm build:frontend passed; git diff --check passed. Real Electron QA at 1384x835 passed the media rail, launcher/catalogue overlay, pin shortcut, Escape/focus restoration, disabled no-compatible state, and visible first-position Styles tile/modal. Alternate-model switching could not be observed because only one compatible video model is installed, but current/fallback profile selection and stale-profile submission guards are covered by focused tests and independent review returned ship. Two unrelated pre-existing AIVS-012 Cover Song assertions in the full shared controls file remain outside this task. Existing AIVS-012 worktree edits were preserved.

Human Review refinement implemented with the existing GenSpace accent CSS-variable boundary and a file-local shared Add media button. LTX keeps all existing media/style handlers while rendering large Start/End slots, Styles left of Add media, and occupied guides below. Music retains existing vocal-mode values and capability filtering behind accessible tabs. Verification: pnpm typecheck:ts passed; MusicSettings.test.tsx passed 3/3; targeted LTX references regression passed 1 with 12 unrelated tests skipped; pnpm build:frontend passed for renderer, Electron main, and preload with normal repository read access; git diff --check passed. Actual Electron QA at approximately 1384x835 logical viewport passed LTX layout, Styles modal open/Escape, music mouse/arrow interaction, launcher/favourite accents, and audio catalogue icons. Image/video catalogue tiles were not captured after the QA app lost foreground, but their launchers/favourites were observed and all catalogues share the verified ModeSelector icon path. Independent review verdict: ship. One combined controls run also reproduced two previously documented unrelated Cover Song empty-render fixture failures; no related source was changed.

User requested consolidating the remaining flat .genspace-mode-theme selectors into native CSS nesting after applying the dropzone example.

Human Review CSS nesting follow-up: consolidated all remaining .genspace-mode-theme rules under one native nested scope, grouped tab/button/generate/input/dropzone states under their owning selectors, and preserved the user's dropzone base color plus existing specificity and declarations. Validation: git diff --check passed; pnpm build:frontend passed; emitted production CSS contains the expected 10 expanded GenSpace theme rule groups. No tests were added because this is a behavior-preserving CSS organization refactor. Electron visual smoke was not repeated because emitted selectors/declarations are unchanged by this refactor; the user's pre-existing base dropzone color remains intact.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-20 11:11
---
Human Review refinement requested: align LTX references with H3, convert music type to tabs, and apply mode-colour accents consistently across workflow navigation.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Refined Quick Gen navigation and inputs: LTX 2.5 references now use the H3-style large frame layout with Styles immediately left of Add media; music type is an accessible Instrumental/Custom/Auto tablist; and image/video/audio workflow accents consistently use blue/purple/green across favourites, launchers, and catalogue icons. Focused tests, strict TypeScript, production bundles, real Electron interaction QA, diff inspection, and independent review passed.

CSS nesting follow-up: reorganized frontend/index.css so GenSpace theme states are colocated under one .genspace-mode-theme block, preserving the user's dropzone rule and existing behavior. Verified with git diff --check, pnpm build:frontend, and inspection of the emitted production selectors.
<!-- SECTION:FINAL_SUMMARY:END -->
