---
id: AIVS-009
title: Refine Music Gen prompt layout
status: Done
assignee:
  - codex
created_date: '2026-08-03 09:07'
updated_date: '2026-08-03 15:35'
labels: []
dependencies: []
references:
  - >-
    C:/Users/rais/AppData/Local/Temp/codex-clipboard-0495884a-e2c9-40f9-abce-a33fd302914b.png
documentation:
  - docs/GENSPACE_ARCHITECTURE.md
modified_files:
  - frontend/views/genspace/music/MusicGenPanel.tsx
  - frontend/views/genspace/music/MusicSettings.tsx
  - frontend/views/genspace/music/MusicPromptControls.tsx
  - frontend/views/genspace/music/MusicGenPanel.test.tsx
  - frontend/views/genspace/music/MusicSettings.test.tsx
  - docs/GENSPACE_ARCHITECTURE.md
priority: medium
type: enhancement
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update Music Gen mode to match the supplied reference layout: place lyrics mode selection at the top of the panel, consolidate language and voice controls into the song-description options row as icon buttons, and place custom lyrics input directly beneath the song description.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Instrumental, Auto Lyrics, and Custom Lyrics tabs render directly below the model selector and before media inputs or prompt fields.
- [x] #2 Language and voice options render as compact icon buttons in the song-description options row and retain their existing behavior and accessible labels.
- [x] #3 Custom Lyrics mode renders its lyrics prompt directly below the song-description prompt; Instrumental and Auto Lyrics preserve their existing lyrics-section visibility rules.
- [x] #4 Existing music generation, lyrics composition, settings persistence, and keyboard/focus behavior remain intact.
- [x] #5 Focused Music Gen tests cover the revised order, custom-lyrics placement, and language/voice controls.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [ ] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Split the existing vocal-mode tab UI from MusicSettings and render it immediately below the model picker in MusicGenPanel; keep mode state and existing three-way behavior unchanged.
2. Move language and vocal-character controls into MusicPromptControls as icon-triggered SettingsDropdown popovers, gated by the resolved vocal mode so instrumental mode keeps hiding vocal controls.
3. Keep the custom lyrics editor in MusicSettings below the song prompt, with its existing Compose Lyrics, Think, seed, and persistence behavior.
4. Extend MusicSettings and MusicGenPanel focused tests for panel order, custom-lyrics placement, and language/voice popover behavior; update the current GenSpace music contract if its layout description is now incomplete.
5. Run focused Vitest coverage, strict TypeScript, frontend build, and git diff checks; record evidence before moving task to Human Review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented top-positioned MusicVocalModeTabs, custom lyrics-only section below Song Prompt, and mode-gated Language/Vocal Character icon popovers in MusicPromptControls.

Focused validation passed via direct cached runtime: node node_modules/vitest/vitest.mjs run frontend/views/genspace/music/MusicSettings.test.tsx frontend/views/genspace/music/MusicGenPanel.test.tsx — 2 files, 7 tests.

Production build passed via node node_modules/vite/bin/vite.js build. Strict TypeScript was attempted but remains blocked by unrelated existing unused-symbol errors in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx.

Full frontend Vitest was attempted: 42 files / 182 tests passed; 10 unrelated existing failures remain in GalleryAssetLibrary, GenSpaceModeTabs, ImageEditMediaInputs, RegionPromptEditor, ReframePanel, and VideoGenPanel. Targeted Music Gen suites are green.

Additional contract checks passed: node node_modules/vitest/vitest.mjs run frontend/views/genspace/logic/generation-requests.test.ts frontend/views/genspace/logic/settings-restore.test.ts frontend/hooks/generation/request-builders.test.ts — 3 files, 26 tests.

Targeted git diff --check completed without whitespace errors; only expected LF/CRLF normalization warnings were emitted.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented Music Gen layout refinement. Vocal mode tabs now render directly below Model; Custom Lyrics content remains below Song Prompt; Language and Vocal Character moved into accessible icon-triggered popovers in the Song Prompt footer and remain hidden for Instrumental mode. Added focused order, placement, visibility, and control-selection coverage, plus updated the GenSpace music contract. Verification: focused Music Gen suites 2 files/7 tests passed; generation/settings/request contract suites 3 files/26 tests passed; Vite production build passed; targeted git diff --check passed. Full frontend suite still has 10 unrelated existing failures, and strict TypeScript still reports unrelated unused symbols in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx. Task is ready for human review; DoD type-check item remains unchecked because baseline errors predate this change.
<!-- SECTION:FINAL_SUMMARY:END -->
