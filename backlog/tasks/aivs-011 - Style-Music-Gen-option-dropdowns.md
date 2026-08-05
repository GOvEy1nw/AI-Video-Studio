---
id: AIVS-011
title: Style Music Gen option dropdowns
status: Done
assignee:
  - codex
created_date: '2026-08-03 10:45'
updated_date: '2026-08-03 15:35'
labels: []
dependencies: []
references:
  - >-
    C:/Users/rais/AppData/Local/Temp/codex-clipboard-abe1039f-0166-47fe-b998-5647fdb0bd1f.png
  - >-
    C:/Users/rais/AppData/Local/Temp/codex-clipboard-547e4fbc-9252-44d9-990d-07151f120625.png
documentation:
  - docs/GENSPACE_ARCHITECTURE.md
modified_files:
  - frontend/views/genspace/music/MusicPromptControls.tsx
  - frontend/views/genspace/music/MusicGenPanel.test.tsx
  - frontend/components/SettingsDropdown.tsx
priority: medium
type: enhancement
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make Music Gen option selectors visually consistent with the app's compact button-based dropdowns shown in the supplied references. Key, time signature, language, and vocal-character choices should feel like the existing resolution, aspect-ratio, and model controls while preserving current music settings behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Music key, time signature, language, and vocal-character controls use the same compact button-dropdown presentation as the existing GenSpace resolution, aspect-ratio, and model controls.
- [x] #2 Opening each Music Gen option control shows a dark in-app menu without the native browser select popup or white option list.
- [x] #3 Selecting an option updates the corresponding MusicSettings value and preserves existing generation, Copy Settings, and saved-settings behavior.
- [x] #4 Instrumental-mode visibility and disabled states remain unchanged, and each control retains an accessible name and keyboard-operable interaction.
- [x] #5 Focused Music Gen tests cover opening each option menu and selecting representative key, time-signature, language, and vocal-character values.
- [x] #6 Long option menus cap visible rows at approximately ten entries and provide vertical scrolling for additional options without affecting custom slider popovers.
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
1. Reuse existing SettingsDropdown in frontend/views/genspace/music/MusicPromptControls.tsx for key/scale and time-signature menus, keeping current icons, labels, disabled behavior, and settings patching.
2. Split the existing vocal popover content into two compact SettingsDropdown controls for language and vocal character, visible only for non-instrumental modes.
3. Extend frontend/views/genspace/music/MusicGenPanel.test.tsx with representative open/select interactions for all four option controls, then run focused tests and cached TypeScript/build checks.
4. Record verification evidence and move task to Human Review after acceptance criteria review.

5. Add a shared max-height/overflow rule to SettingsDropdown option lists so menus show about ten rows before scrolling, then verify Music menus still open and select correctly.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User added requirement during implementation: dropdown menus must cap visible options at approximately 10 rows and show a scrollbar for longer lists; implement through shared SettingsDropdown list styling.

Verification: node node_modules/vitest/vitest.mjs run frontend/views/genspace/music/MusicGenPanel.test.tsx frontend/views/genspace/music/MusicSettings.test.tsx — 2 files, 7 tests passed.

Verification: node node_modules/vite/bin/vite.js build — renderer, Electron main, and preload bundles passed; existing dynamic-import and chunk-size warnings only.

Verification: git diff --check — clean apart from repository-wide LF/CRLF conversion warnings.

Validation limitation: node node_modules/typescript/bin/tsc --noEmit reports 12 pre-existing unused-symbol diagnostics in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx; no diagnostics in task files. Full Vitest remains 185/194 with the same nine unrelated failures in GalleryAssetLibrary, GenSpace mode accent, Image Edit, Reframe, and Video Tools suites.

Scope check: implementation changes are limited to MusicPromptControls.tsx, MusicGenPanel.test.tsx, and shared SettingsDropdown.tsx; existing unrelated worktree changes preserved.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated Music Gen option controls to use the shared dark button-dropdown presentation. Key/scale and time signature now use SettingsDropdown option lists; non-instrumental modes expose separate Language and Vocal Character icon menus. All selections continue to patch MusicSettings through the existing controller path, and instrumental visibility/disabled behavior remain intact. Shared SettingsDropdown option lists now cap at max-h-80 (approximately ten compact rows) with overflow-y-auto scrolling, while custom slider popovers remain unchanged. Added focused interactions covering menu opening and representative selection for key, time signature, language, and vocal character, plus scroll-container coverage. Verification: focused music tests 7/7 pass; production renderer/Electron main/preload build passes; git diff --check clean. Full Vitest remains 185/194 because of nine unrelated baseline failures; strict TypeScript remains blocked by 12 unrelated unused-symbol diagnostics outside task files. Native visual QA was unavailable because managed in-app Browser refused local loopback navigation.
<!-- SECTION:FINAL_SUMMARY:END -->
