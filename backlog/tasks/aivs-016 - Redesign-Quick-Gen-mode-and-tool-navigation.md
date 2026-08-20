---
id: AIVS-016
title: Redesign Quick Gen mode and tool navigation
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-19 16:04'
updated_date: '2026-08-19 17:31'
labels:
  - frontend
  - quick-gen
  - ux
dependencies: []
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
1. Define stable Quick Gen workflow metadata and persist validated favourite workflow IDs through the existing app-settings contract. 2. Route image/video/audio workflow selection through the GenSpace controller so the current curated profile is retained when compatible and otherwise replaced by the first compatible installed profile; show video workflows from aggregate profile capability rather than the selected model. 3. Convert the media selector into a left icon rail with favourites and turn ModeSelector into a prominent launcher with an accessible prompt-panel overlay catalogue and pin controls. 4. Move the existing LTX Styles trigger into VideoMediaInputs while retaining the current modal, styleId, compatibility clearing, and generation behavior. 5. Add only focused workflow/persistence/interaction checks, then run TypeScript/Python checks, the frontend build, real-Electron visual interaction QA, diff inspection, and independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Starting from a dirty dev worktree containing the completed AIVS-012 Styles changes, including ModeSelector.tsx and backend style work. Preserve those edits and keep AIVS-016 changes confined to Quick Gen navigation/settings plus the Styles trigger relocation.

Implemented stable workflow metadata, persisted favourites, controller-owned workflow-to-profile resolution, media/favourites rail, prompt-pane catalogue overlay, and LTX Styles relocation. Verification: pnpm typecheck:ts passed; pnpm typecheck:py passed; workflows and VideoModeTabs focused Vitest files passed 2/2; Styles relocation focused Vitest passed 1 with 12 skipped; backend uv run pytest tests/test_settings.py -q passed 23/23; pnpm build:frontend passed; git diff --check passed. Real Electron QA at 1384x835 passed the media rail, launcher/catalogue overlay, pin shortcut, Escape/focus restoration, disabled no-compatible state, and visible first-position Styles tile/modal. Alternate-model switching could not be observed because only one compatible video model is installed, but current/fallback profile selection and stale-profile submission guards are covered by focused tests and independent review returned ship. Two unrelated pre-existing AIVS-012 Cover Song assertions in the full shared controls file remain outside this task. Existing AIVS-012 worktree edits were preserved.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Redesigned Quick Gen with an Image/Video/Audio icon rail, persistent favourite workflow shortcuts, a large workflow launcher whose catalogue overlays the prompt pane, workflow-led compatible model selection, and the LTX Styles tile in media inputs. Focused tests, TypeScript/Python checks, frontend build, real Electron interaction QA, diff inspection, and independent review passed.
<!-- SECTION:FINAL_SUMMARY:END -->
