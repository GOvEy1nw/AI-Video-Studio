---
id: AIVS-012
title: Refine video asset use menus and remove obsolete video input refs
status: Done
assignee:
  - '@codex'
created_date: '2026-08-03 12:05'
updated_date: '2026-08-03 15:36'
labels: []
dependencies: []
type: enhancement
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update GenSpace and Shared Asset Library video/image asset actions so video workflows expose the Video Tools choices directly, while obsolete video input reference options no longer duplicate Video Tools mode.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Media input video reference options no longer include Convert SDR to HDR or Continue Video.
- [x] #2 Selected-generation video assets show a Use Video control with a scrollable max-h-60 dropdown containing Reference, Reframe, Extend, Relight, and every supported video-use option.
- [x] #3 Asset Library video context menus replace Reframe with a Use Video submenu containing the supported video-use options.
- [x] #4 Asset Library image context menus replace direct Use Image options with a Use Image submenu containing the supported image-use options.
- [x] #5 Focused frontend tests cover the changed options, selected-generation menu, and both asset-library context menus.
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
1. Remove obsolete SDR-to-HDR and Continue Video entries from the standard video media-role menu while retaining legacy role identifiers for saved-data compatibility; add focused option coverage.
2. Add a shared Use Video dropdown with Reference plus every curated Video Tool option, including max-h-60 overflow scrolling, and add a context-menu variant to the existing Use Image dropdown.
3. Wire selected-generation and GenSpace Asset Library context-menu actions through the existing controller hand-offs for standard video reference and Video Tools source selection.
4. Add focused component tests for selected-generation video actions, image/video context submenus, and the media-role option contract; run targeted frontend checks, typecheck, build, and diff validation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented UseVideoDropdown with Reference plus all curated Video Tool options and max-h-60 overflow scrolling.

Removed SDR-to-HDR and Continue Video from standard media-role choices; legacy role IDs remain in GUIDE_MEDIA_ROLES for saved-data compatibility.

Replaced GenSpace selected-generation Reframe and AssetContextMenu direct media actions with Use Video and Use Image submenus. Added focused tests in GenSpaceSelectedGeneration.test.tsx, AssetContextMenu.test.tsx, and media-inputs.test.ts.

Validation: direct Vitest changed-path tests pass 10/10; Vite production build passes. Full selected-generation file has two pre-existing jsdom audio playback failures. Direct TypeScript check is blocked by 13 pre-existing unused-symbol diagnostics in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx. git diff --check exits clean with existing LF/CRLF warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented AIVS-012: standard video media input choices no longer expose Convert SDR to HDR or Continue Video; selected-generation video assets and GenSpace asset context menus now use Use Video with Reference and all curated Video Tools, while image context actions use a Use Image submenu. Added max-h-60 scrolling and focused coverage. Verified changed-path Vitest tests 10/10, production Vite build, and clean git diff check; full TypeScript remains blocked by pre-existing unused-symbol diagnostics outside this change.
<!-- SECTION:FINAL_SUMMARY:END -->
