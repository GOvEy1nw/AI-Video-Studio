---
id: AIVS-034
title: Unify setup and model-empty UI states
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-06 10:27'
updated_date: '2026-08-06 11:47'
labels: []
dependencies: []
modified_files:
  - .projectmem/summary.md
  - frontend/components/FloatingMenu.tsx
  - frontend/components/ModelPackManager.tsx
  - frontend/components/PythonSetup.tsx
  - frontend/components/SettingsDropdown.tsx
  - frontend/components/SettingsModal.tsx
  - frontend/views/director/DirectorWorkspacePanel.tsx
  - frontend/views/genspace/GenSpaceGallery.tsx
  - frontend/views/genspace/components/ModeSelector.tsx
  - frontend/views/genspace/image/ImageModeTabs.tsx
  - frontend/views/genspace/image/ImageModelControls.tsx
  - frontend/views/genspace/video/VideoGenPanel.tsx
  - frontend/views/genspace/video/VideoModeTabs.tsx
  - frontend/views/genspace/video/VideoModeTabs.test.tsx
type: enhancement
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Apply requested UI consistency cleanup across first-run setup, Quick Gen image/video, Director, shared Asset Library empty state, and model dropdown sizing. Remove redundant unavailable-model/download affordances while keeping in-app model management available.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 First-run setup has no model-download stage, and project, checkpoint, and LoRA folder choices appear together on project storage page.
- [x] #2 Image prompt settings no longer show duplicate Download Models action.
- [x] #3 Video mode keeps normal Generate layout when no model is available.
- [x] #4 Director hides selected-model-unavailable notice and uses same model, resolution, and aspect controls as Quick Gen.
- [x] #5 Quick Gen empty Asset Library uses same shared empty presentation as Director and Video Editor.
- [x] #6 Model dropdown menu matches trigger width.
- [x] #7 TypeScript checks, focused relevant tests, production frontend build, and visual smoke are completed or documented if environment-blocked.
- [x] #8 When no video model is installed, Video Quick Gen shows Download Models in the model section while retaining the normal media, prompt, and output layout.
- [x] #9 Opening a model dropdown renders directly in its final aligned position without a bottom-end width snap.
- [x] #10 Image and Video mode tablists are replaced by a shared combined dropdown and selected-mode/tool indicator; Video tool choices are included in the same dropdown and Retake remains disabled.
- [x] #11 Model Manager Refresh rescans model packs and updates shared frontend model availability/options before completing.
- [x] #12 Advanced Save & Reload rescans model packs and refreshes shared frontend model availability after checkpoint or LoRA folder changes.
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
1. Preserve Video’s normal capability-driven layout using curated profile metadata, but gate its model selector on installed profiles so the no-model state shows Download Models.
2. Replace ImageModeTabs and VideoModeTabs presentation with one shared split-style mode selector backed by existing SettingsDropdown/FloatingMenu behavior; combine Video Generate, concrete tool choices, and disabled Retake into one menu.
3. Make matched-width floating menus use anchor width during the first position calculation, eliminating open-time snap.
4. Wire Model Manager manual scans and Advanced checkpoint/LoRA Save & Reload through Electron pack refresh followed by the shared ModelProfilesProvider refresh.
5. Inspect full diff, run focused menu/profile tests where available, TypeScript, production frontend build, blocked native visual smoke documentation, and fresh independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented one-page storage setup without first-run model packs; project/checkpoint/LoRA lookups settle independently and Browse remains available for recovery.

Normalized unavailable-model and empty-library presentation through existing shared controls. Director keeps unavailable-model generation validation but suppresses only its redundant inline notice.

Verification: pnpm typecheck:ts (exit 0); pnpm test:frontend -- frontend/components/FloatingMenu.test.tsx (5 passed); pnpm build:frontend (renderer, Electron main, preload exit 0); git diff --check (exit 0). Fresh orchestrate reviewer verdict: ship.

Native visual smoke blocked: in-app browser lacks Electron preload API and crashes on window.electronAPI; available tooling cannot capture/control native Electron window. No security/config workaround used.

ProjectMem decision updated to record removal of first-run model-pack stage and preserve current onboarding contract.

Human review requested follow-up: restore Download Models for zero installed video profiles, remove matched-width menu snap, replace Image/Video mode tabs with combined dropdown + selected indicator, and synchronize profile availability after Model Manager refresh or Advanced folder reload.

Follow-up implementation verified: Video picker is gated on installed profiles while normal capability-driven layout remains; matched-width menus calculate first position using final anchor width; shared Image/Video mode selector includes concrete Video tools and accessible disabled Retake; Model Manager Refresh and Advanced Save & Reload rescan packs then refresh shared profile availability.

Final verification: pnpm typecheck:ts (exit 0); FloatingMenu.test.tsx (5 passed); ModelProfilesContext.test.tsx (4 passed); VideoModeTabs.test.tsx (1 passed); pnpm build:frontend (renderer, Electron main, preload exit 0); git diff --check (exit 0). Fresh reviewer initially found disabled-option accessibility regression; corrected with native disabled semantics/accessibility reason and focused regression test; re-review verdict ship. Native Electron visual smoke remains environment-blocked because browser tooling lacks window.electronAPI.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Unified setup and model-empty UI states, removed redundant model actions/notices, aligned Director and Asset Library presentation, and matched model-menu width. Follow-up adds installed-profile gating for Video Download Models state, snap-free first model-menu placement, shared Image/Video mode-and-tool dropdown, and synchronized model availability after Model Manager or Advanced folder refresh. Verification: TypeScript, three focused Vitest files (10 tests total), production renderer/Electron/preload build, diff check, and independent review all pass. Native Electron visual smoke is documented as blocked by unavailable preload API in browser tooling.
<!-- SECTION:FINAL_SUMMARY:END -->
