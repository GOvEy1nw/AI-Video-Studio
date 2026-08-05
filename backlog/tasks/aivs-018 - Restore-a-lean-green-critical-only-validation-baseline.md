---
id: AIVS-018
title: 'Restore a lean, green, critical-only validation baseline'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 14:23'
labels:
  - audit
dependencies: []
documentation:
  - docs/AiVS-Code-Health-Performance-Audit/01_PR_LEAN_CRITICAL_TEST_BASELINE.md
modified_files:
  - AGENTS.md
  - backend/tests/test_no_mock_usage.py
  - backend/tests/test_pyright.py
  - frontend/components/FloatingMenu.test.tsx
  - frontend/components/GalleryAssetLibrary.test.tsx
  - frontend/components/GalleryAssetLibrary.tsx
  - frontend/components/ModelPackManager.test.tsx
  - frontend/components/ModelPicker.test.tsx
  - frontend/components/SettingsDropdown.test.tsx
  - frontend/views/genspace/GenSpaceGallery.test.tsx
  - frontend/views/genspace/GenSpaceModeAccent.test.tsx
  - frontend/views/genspace/GenSpaceModeTabs.test.tsx
  - frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx
  - frontend/views/genspace/components/AspectRatioDropdown.test.tsx
  - frontend/views/genspace/components/FramingControl.test.tsx
  - frontend/views/genspace/components/GenPanelSection.test.tsx
  - frontend/views/genspace/components/GenSpaceControls.test.tsx
  - frontend/views/genspace/components/MediaCropPopover.test.tsx
  - frontend/views/genspace/components/ReframeEditor.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/hooks/useGenSpaceGallery.ts
  - frontend/views/genspace/image/ImageEditMediaInputs.test.tsx
  - frontend/views/genspace/image/ImageModeTabs.test.tsx
  - frontend/views/genspace/image/ImageModelControls.test.tsx
  - frontend/views/genspace/image/RegionPromptEditor.test.tsx
  - frontend/views/genspace/music/MusicGenPanel.test.tsx
  - frontend/views/genspace/video/ReframePanel.test.tsx
  - frontend/views/genspace/video/ReframePanel.tsx
  - frontend/views/genspace/video/VideoGenPanel.test.tsx
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - package.json
  - scripts/test-project-asset-import.mjs
  - docs/TESTING_POLICY.md
priority: high
type: chore
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 01. Make the test/typecheck signal trustworthy before changing performance-sensitive architecture. Delete presentation-coupled tests and dead production residue instead of updating stale assertions to the latest markup.

This PR is intentionally allowed to have a large **negative** line count. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `pnpm run typecheck:ts` has zero diagnostics.
- [x] #2 `pnpm run test:frontend` has zero failures and zero unhandled errors.
- [x] #3 Backend focused tests pass and `pnpm run typecheck:py` passes independently.
- [x] #4 Frontend test-case count is reduced by **at least 20%** from the pinned 208-case head baseline, without deleting the named critical contract areas.
- [x] #5 Frontend test-file count is lower; empty/one-trivial-assertion files are removed.
- [x] #6 No retained frontend test asserts exact Tailwind classes, pixel dimensions, sibling order, or implementation-only placement data unless the file is testing a pure geometry algorithm.
- [x] #7 No backend pytest case invokes a linter/type checker or scans test source for style rules.
- [x] #8 `scripts/test-project-asset-import.mjs` never reports success after testing only fallback code.
- [x] #9 `docs/TESTING_POLICY.md` and `AGENTS.md` agree.
- [x] #10 Production renderer/Electron/preload build succeeds.
- [x] #11 A short manual smoke covers Home, project open, Quick Gen controls, Director open, Video Editor open, Settings, and Asset Library multi-select.
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
1. Revalidate stacked AIVS-017 baseline and inventory retained risk contracts; preserve all 27 Electron path-boundary cases and live LegacyPromptMedia.
2. Remove only dead renderer symbols in GalleryAssetLibrary, ReframePanel, and VideoGenPanel; verify strict TypeScript.
3. Apply retention matrix across frontend component suites: delete presentation-only files/cases, rewrite retained tests around stable behavior, keep frontend cases at 166 or fewer, reduce frontend test-file count, and eliminate jsdom media errors.
4. Delete backend meta-policy pytest files; make project-asset import script require production build output; simplify nested pnpm scripts.
5. Add docs/TESTING_POLICY.md and align AGENTS.md validation/no-mock guidance.
6. Run focused checks, full frontend suite, independent Pyright and focused backend tests, production build, diff inspection, and short native UI smoke; record counts and evidence before Human Review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Baseline and scope
- Revalidated current frontend baseline: 205 cases across 50 frontend test files; pinned task baseline: 208 cases.
- Final retained baseline: 131 frontend cases across 32 frontend files, a 37.0% reduction from pinned 208. All 27 Electron path/security cases remain; full Vitest run totals 158 cases across 39 files.
- Deleted 18 presentation-only frontend suites: ModelPackManager, ModelPicker, SettingsDropdown, GenSpaceGallery, GenSpaceModeAccent, GenSpaceModeTabs, GenSpaceSelectedGeneration, AspectRatioDropdown, FramingControl, GenPanelSection, MediaCropPopover, ReframeEditor, ImageEditMediaInputs, ImageModeTabs, ImageModelControls, RegionPromptEditor, ReframePanel, and VideoGenPanel.
- Simplified FloatingMenu, GalleryAssetLibrary, GenSpaceControls, and MusicGenPanel tests by removing exact class, pixel, DOM-order, and placement assertions.
- Deleted backend meta-policy tests test_pyright.py and test_no_mock_usage.py.
- Removed confirmed dead Gallery card/action/model callback plumbing plus unused ReframePanel/VideoGenPanel symbols. LegacyPromptMedia retained because it still has a live render path.
- Added docs/TESTING_POLICY.md and aligned AGENTS.md. Simplified nested pnpm scripts. Project-asset import script now exits clearly unless a standalone production module exists; fallback-only code cannot report success.

Retained critical contracts
- Generation request builders, settings restore, immutable project-scoped result persistence, cancellation/poll lifecycle, media crop/Reframe/Region geometry, Director request/domain behavior, Asset Library filtering/multi-select/keyboard/bulk-delete/pointer behavior, native import/path approval, and all Electron path-security tests.
- FloatingMenu pure flip/clamp geometry and portal interaction remain. No test is retained solely for presentation coupling.

Verification
- pnpm run typecheck:ts — passed, including after final reviewer-requested callback cleanup.
- pnpm run test:frontend — 39 files, 158/158 tests passed, zero failures and zero unhandled errors.
- pnpm test:frontend -- frontend/views/genspace/hooks/useGenSpaceGallery.test.tsx — 3/3 passed after final cleanup.
- pnpm run typecheck:py — 0 errors, 0 warnings.
- uv run pytest tests/test_generation.py tests/test_model_profiles.py tests/test_music_generation.py tests/test_settings.py -q --tb=short — 139 passed; one unrelated Torch pynvml deprecation warning.
- pnpm run build:frontend — renderer, Electron main, and preload builds passed; existing chunk/dynamic-import warnings only.
- git diff --check — passed after final changes.
- node scripts/test-project-asset-import.mjs — expected exit 1 with clear standalone-production-module-required message; no fallback ran.
- Native isolated Electron smoke with real preload/backend passed Home, project open, Quick Gen Image/Video/Music, Director, Video Editor, Settings, and empty-library multi-select.
- Two independent final reviews completed. Initial fix-first dead callback finding corrected and focused checks rerun; fresh re-review returned ship.

Validation deliberately not expanded
- Full backend suite not run: task requires focused backend coverage plus independent Pyright, both passed.
- Full frontend/build/native smoke not rerun after final type/dead-object-field cleanup; TypeScript and focused Gallery hook tests cover that bounded correction.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored lean critical-only validation baseline. Removed presentation-coupled frontend suites, backend meta-policy tests, dead renderer residue, false-success asset-import fallback, and nested Corepack re-entry. Added risk-based testing policy. Final baseline: 131 frontend cases in 32 files plus all 27 Electron security cases; full Vitest 158/158. TypeScript, Pyright, focused backend tests, production build, diff check, native Electron smoke, and focused post-review checks passed. Independent final verdict: ship. Residual: test:media-import intentionally fails until a standalone production Electron module is emitted, preventing false success.
<!-- SECTION:FINAL_SUMMARY:END -->
