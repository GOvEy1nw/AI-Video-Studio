---
id: AIVS-014
title: Unify smart floating menus
status: Done
assignee:
  - '@codex'
created_date: '2026-08-03 14:08'
updated_date: '2026-08-03 15:36'
labels: []
dependencies: []
modified_files:
  - frontend/components/FloatingMenu.tsx
  - frontend/components/FloatingMenu.test.tsx
  - frontend/components/SettingsDropdown.tsx
  - frontend/components/SettingsDropdown.test.tsx
  - frontend/components/UseImageDropdown.tsx
  - frontend/components/UseVideoDropdown.tsx
  - frontend/components/MenuBar.tsx
  - frontend/components/GalleryBinBar.tsx
  - frontend/components/SeedControl.tsx
  - frontend/components/KeyboardShortcutsModal.tsx
  - frontend/views/Home.tsx
  - frontend/views/VideoEditor.tsx
  - frontend/views/director/DirectorTimeline.tsx
  - frontend/views/director/DirectorSidebar.tsx
  - frontend/views/director/DirectorWorkspacePanel.tsx
  - frontend/views/editor/AssetContextMenu.tsx
  - frontend/views/editor/AssetContextMenu.test.tsx
  - frontend/views/editor/ClipContextMenu.tsx
  - frontend/views/editor/TakeContextMenu.tsx
  - frontend/views/editor/ToolsPanel.tsx
  - frontend/views/editor/ProgramMonitor.tsx
  - frontend/views/editor/LeftPanel.tsx
  - frontend/views/editor/GapGenerationModal.tsx
  - frontend/views/editor/useContextMenuEffects.ts
  - frontend/views/genspace/components/MediaRoleMenu.tsx
  - frontend/views/genspace/components/GenSpaceControls.test.tsx
  - frontend/views/genspace/components/AspectRatioDropdown.test.tsx
  - frontend/views/genspace/music/MusicGenPanel.test.tsx
  - frontend/views/genspace/video/VideoGenPanel.test.tsx
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace duplicated div-based context and dropdown menu positioning with shared frontend behavior so menus render above app content and stay within viewport.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Shared primitive portals menus above app stacking contexts
- [x] #2 Anchored dropdowns and pointer context menus flip or shift inside viewport edges
- [x] #3 Existing menu actions, variants, dismissal, and accessibility behavior remain intact
- [x] #4 Focused tests cover clamping, flipping, and representative integrations
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
1. Add one body-portaled FloatingMenu primitive with anchored and pointer positioning, automatic side fallback, viewport clamping, scroll/resize reflow, and bounded overflow. 2. Migrate existing interactive div-based context/dropdown menus while preserving native selects, dialogs, tooltips, actions, and dismissal semantics. 3. Add positioning and representative integration tests, then run strict TypeScript, focused/full Vitest, frontend build, and diff checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented one shared FloatingMenu owner using document.body portals, fixed positioning, maximum browser z-index, side/alignment fallback, viewport clamping, bounded overflow, scroll/resize reflow, element/pointer/virtual-rect anchors, and reusable portaled hover/focus submenus. Migrated div-based dropdown/context menus across shared components, Home, Director, GenSpace, and Video Editor. Native selects, dialogs, tooltips, and already-specialized crop/camera popovers remain separate.

Verification: `node_modules\.bin\vitest.cmd run frontend/components/FloatingMenu.test.tsx frontend/components/SettingsDropdown.test.tsx frontend/views/genspace/components/AspectRatioDropdown.test.tsx frontend/views/genspace/components/GenSpaceControls.test.tsx frontend/views/genspace/music/MusicGenPanel.test.tsx frontend/views/editor/AssetContextMenu.test.tsx` passed 6 files / 25 tests. Targeted VideoGenPanel migrated-menu test passed 1 test. `node_modules\.bin\vite.cmd build` passed renderer, Electron main, and preload production builds. Task-scoped `git diff --check` passed with existing line-ending warnings.

Broader baseline limitations: pinned pnpm launcher refused to run because registry signatures could not be verified, so repository-local executables were used. Strict `tsc --noEmit` reached compilation and reported only 13 unrelated pre-existing unused-symbol diagnostics in GalleryAssetLibrary, ReframePanel, and VideoGenPanel; no FloatingMenu/migration diagnostics. Last full Vitest run passed 191/203 tests and exposed one stale migrated-menu assertion, fixed and targeted-pass verified afterward; remaining 11 failures and one media-play jsdom error belong to unrelated active GenSpace/gallery work. Manual Electron visual smoke test was not run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added shared smart floating-menu infrastructure and migrated app div-based dropdown/context menus to it. Menus now portal to document.body at maximum z-index, choose fallback sides/alignment, clamp within viewport padding, reflow on scrolling/resizing, and bound oversized content. Added shared portaled submenu behavior and removed duplicated context-menu edge-clamping effects while preserving action and dismissal contracts. Focused integration/positioning tests and production renderer/Electron/preload builds pass. Full-suite and strict-typecheck baselines remain red only from documented unrelated active-worktree issues; manual Electron visual review remains reviewer validation.
<!-- SECTION:FINAL_SUMMARY:END -->
