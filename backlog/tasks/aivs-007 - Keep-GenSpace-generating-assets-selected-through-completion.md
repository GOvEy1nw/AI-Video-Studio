---
id: AIVS-007
title: Keep GenSpace generating assets selected through completion
status: Done
assignee:
  - '@codex'
created_date: '2026-08-02 17:00'
updated_date: '2026-08-02 18:48'
labels: []
dependencies: []
documentation:
  - docs/GENSPACE_ARCHITECTURE.md
  - AGENTS.md
modified_files:
  - frontend/views/genspace/GenSpaceSelectedGeneration.tsx
  - frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx
  - docs/GENSPACE_ARCHITECTURE.md
priority: high
type: enhancement
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Improve GenSpace generation feedback so asset-library cards stay visually minimal while generating, the active generation details are shown in the selected-generation area, and the completed result remains selected for immediate inspection.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A generating asset card shows only a mode-themed background, progress bar, and cancel action; it does not show generation text, steps, preview media, or other card details.
- [x] #2 Starting a generation automatically selects its generating asset and shows detailed progress, including progress, loading/phase information, and preview where available, in the selected-generation area.
- [x] #3 When generation completes, the generated asset remains selected and the selected-generation area immediately shows the finished result without requiring another card click.
- [x] #4 Existing cancellation, multi-generation, project-scoped persistence, and normal asset-card selection behavior remain intact.
- [x] #5 Focused frontend regression tests cover generating-card presentation, automatic selection, and selection retention on completion.
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
1. Update `GenSpaceGallery` active-generation card to render only a mode-themed surface, progress bar, and cancel button while retaining detailed progress fields for the center panel.
2. Let `useGenSpaceGallery` clear any previously selected asset on the rising edge of `isGenerating`, then expose its selection setter to the controller.
3. Move result-persistence wiring after gallery setup and select the first persisted generated asset through an `onAssetAdded` callback so completion immediately replaces the transient progress view with the finished asset in the center panel.
4. Add focused frontend regressions for minimal card presentation, generation-start selection, and completion selection retention; preserve cancellation, filtering, multi-output, and project-scoped persistence paths.
5. Run focused Vitest suites, strict TypeScript, frontend build, and diff checks; record evidence before moving task to Human Review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete. GenSpaceGallery now renders the transient active-generation card as a mode-themed surface with only progress and cancel controls; detailed lifecycle content remains in GenSpaceSelectedGeneration.

useGenSpaceGallery clears prior selection on the rising edge of isGenerating and exposes selectAsset. useGenSpaceController wires onAssetAdded through useGenSpaceResultPersistence, selecting the first persisted image output or the persisted video/music asset at completion.

Verification: focused Vitest command covering GenSpaceGallery, GenSpaceSelectedGeneration, useGenSpaceGallery, and useGenSpaceResultPersistence passed 4 files / 10 tests. Full Vitest passed 42 files / 180 tests; eight unrelated existing failures remain in GenSpaceModeTabs, ImageEditMediaInputs, RegionPromptEditor, MusicSettings, ReframePanel, and VideoGenPanel.

Verification: local Vite build passed renderer, Electron main, and preload bundles. git diff --check passed with existing Windows LF/CRLF warnings. Strict TypeScript could not pass because the worktree still has four unrelated unused-symbol errors in ReframePanel.tsx and VideoGenPanel.tsx; no AIVS-007 diagnostics were reported.

Updated docs/GENSPACE_ARCHITECTURE.md with the transient-card, center-detail, and completion-selection contract.

Final UI refinement: GenSpaceSelectedGeneration now owns active-generation header progress. Header shows normalized status (for example, Loading Model), model/step/phase detail, one persistent progress bar, percentage, and icon cancel action. Preview body renders preview only; spinner and DownloadProgressView overlays were removed. Added regression coverage for normalized loading text, composed detail layout, persistent bar during model lifecycle, preview-only body, and cancel action.

Final verification update: direct bundled Vitest full run completed with 179/188 tests passing. Nine failures remain outside AIVS-007: known GenSpaceModeTabs, ImageEditMediaInputs (2), RegionPromptEditor, MusicSettings, ReframePanel (2), and VideoGenPanel failures, plus GalleryAssetLibrary metadata expectation. Direct bundled TypeScript reports only four unrelated unused-symbol errors in ReframePanel.tsx and VideoGenPanel.tsx; pnpm typecheck:ts could not start because offline pnpm signature verification failed. Focused AIVS-007 suite remains 4 files / 10 tests passing. Direct Vite build and git diff --check pass.

Task is ready for human review; DoD type-check item remains unchecked because unrelated worktree errors prevent a clean repository-wide check.

Validation correction after final source check: direct bundled TypeScript currently reports six unrelated unused-symbol errors in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx. No diagnostics reference GenSpaceSelectedGeneration. The repository-wide type-check DoD item remains unchecked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the final GenSpace generation-progress refinement. Active-generation details now render in the selected-generation header as normalized main status, model name, step/phase details, percentage, one persistent progress bar, and an icon cancel control. The preview body renders only the current preview; spinner and download-progress overlays were removed. Existing minimal generating cards, automatic start selection, and completion selection behavior remain intact.

Verification: focused GenSpace suite passed 4 files / 10 tests; direct Vite production build passed renderer, Electron main, and preload; git diff --check passed with line-ending warnings. Direct TypeScript found no diagnostics in changed files but remains blocked by six unrelated unused-symbol errors in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx. Full Vitest completed 179/188 with nine unrelated UI expectation failures outside the changed selected-generation files. Task is in Human Review; repository-wide type-check DoD item remains unchecked.
<!-- SECTION:FINAL_SUMMARY:END -->
