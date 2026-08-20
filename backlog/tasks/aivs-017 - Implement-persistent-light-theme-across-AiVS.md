---
id: AIVS-017
title: Implement persistent light theme across AiVS
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-20 17:47'
updated_date: '2026-08-20 19:48'
labels:
  - frontend
  - theme
  - settings
dependencies: []
references:
  - docs/AI-Video-Studio-Light-Theme-Implementation-Plan.md
priority: high
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a complete user-selectable Dark/Light appearance to the Electron application, preserving the existing dark theme, using the current settings owner and semantic Tailwind token layer. Follow the checked-in implementation plan without changing generation, project, media, or Electron security boundaries.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Settings General exposes accessible Dark and Light choices that apply immediately without restart
- [x] #2 Dark remains the default and existing settings files load without migration or data loss
- [x] #3 The selected uiTheme persists through the canonical backend app-settings schema and invalid values are rejected
- [x] #4 A CSP-safe local cache applies the selected theme before React renders in packaged Electron builds
- [x] #5 Application chrome, shared controls, Asset Library, Quick Gen, Director, Video Editor, setup, model management, diagnostics, loading, and recovery surfaces are usable in both themes while media stages may remain deliberately dark
- [x] #6 Focused frontend/backend tests, TypeScript and Python type checks, production build, residual colour audit, and real Electron packaging smoke provide completion evidence
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
1. Extend the canonical backend and renderer settings contracts with dark-default uiTheme, add the defensive renderer theme utility and CSP-safe pre-paint bootstrap, and protect those stable contracts with focused tests. 2. Complete the root semantic token palette and migrate shared controls, menus, modals, and the Settings General appearance radios before leaf screens. 3. Migrate shell, Home, Project, Asset Library, Quick Gen, Director, Video Editor, setup, model-management, diagnostics, loading, and recovery chrome by semantic role while preserving fixed-dark media stages and all behavior owners. 4. Re-audit explicit colours, inspect the full diff, run focused settings/theme tests plus TS/Python checks and the production build, then validate the real Electron and unpacked Windows CSP/startup path. 5. Obtain fresh independent code review, correct any required findings, record exact evidence, and move the task to Human Review only after each acceptance criterion is satisfied.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Live audit on dev found 1,640 dark-specific utilities across 109 frontend files; no existing Input primitive; frontend/index.css is the central incomplete token owner; document-root theming will cover existing body portals. Preserve the untracked implementation plan and current ahead-of-origin commit.

Completed semantic theme migration with media-stage exceptions preserved. Focused Vitest: 5 passed. Backend settings pytest: 27 passed. TypeScript and Pyright: clean. Frontend build and build:fast:win: passed. Residual audit: zero active-chrome raw colors; remaining direct dark colors are classified media/content/status roles. Packaged Electron file:// smoke verified synchronous dark prepaint, accessible immediate Dark/Light switching, light persistence across reload, Home/Quick Gen image-video-audio-music/Director/Video Editor/Asset Library and every Settings tab in Light, compiled primary white contrast, 60% modal scrims, fixed-dark overlay white contrast, and restoration of the original dark preference. Full frontend suite was run once: 58 files and 255 tests passed; 12 failures across six pre-existing unrelated profile/GenSpace test files matched the pre-change baseline. Fresh independent correction review verdict: ship, no remaining findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented persistent Dark/Light appearance across AiVS using the canonical backend settings owner, CSP-safe prepaint cache, root semantic tokens, accessible Settings radios, and semantic chrome across all application surfaces while preserving fixed-dark media stages. Verified with focused frontend/backend tests, both type checks, production and unpacked Windows builds, residual color audit, real packaged Electron file:// interaction/persistence/workspace smoke, and an independent ship review.
<!-- SECTION:FINAL_SUMMARY:END -->
