---
id: AIVS-021
title: Isolate project-state domains and consumer renders
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 14:15'
labels:
  - audit
dependencies:
  - AIVS-019
  - AIVS-020
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/04_PR_PROJECT_STATE_RENDER_ISOLATION.md
modified_files:
  - frontend/App.tsx
  - frontend/contexts/ProjectContext.test.ts
  - frontend/contexts/ProjectContext.tsx
  - frontend/views/DirectorEditor.tsx
  - frontend/views/Home.tsx
  - frontend/views/Project.tsx
  - frontend/views/VideoEditor.tsx
  - frontend/views/genspace/GenSpaceOverlays.tsx
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/hooks/useGenSpaceGallery.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceGallery.ts
  - frontend/views/genspace/hooks/useGenSpaceResultPersistence.test.tsx
  - frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts
priority: high
type: enhancement
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 04. Prevent an update in one project domain from invalidating every project consumer. Keep the current data model and mutation semantics, but expose stable, narrower context values.

This is a render-isolation refactor, not a move to Redux/Zustand and not a project-schema rewrite. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No new runtime state-management dependency.
- [x] #2 Provider values are memoised per domain.
- [x] #3 Asset-only consumers do not rerender on Editor/Director timeline changes.
- [x] #4 Editor timeline consumers do not rerender on asset favourite/bin changes.
- [x] #5 Director timeline consumers do not rerender on Video Editor timeline changes.
- [x] #6 Navigation/tab changes do not recreate asset/timeline action callbacks.
- [x] #7 GenSpace, Director, Video Editor, Home, and Project no longer use the broad compatibility `useProjects()` hook.
- [x] #8 Unchanged arrays/objects retain reference identity.
- [x] #9 Existing project schema and persisted JSON remain unchanged.
- [x] #10 Submission results still save to the submission project if the user switches projects during generation.
- [x] #11 One render-isolation test passes.
- [x] #12 Existing critical project/persistence tests, typecheck, and production build pass.
- [x] #13 No tests inspect component layout or class names.
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
1. Revalidate broad useProjects consumers and baseline project/persistence behavior on current dev in an isolated worktree. 2. Keep one projects state owner while exposing small typed navigation, list/meta, asset, editor-timeline, Director-timeline, and handoff contexts with frozen empty fallbacks, memoised values, and callback-stable functional mutations; retain useProjects only as a compatibility adapter. 3. Migrate App, Home, Project, GenSpace, Director, Video Editor, and their hot containers to the narrow hooks without changing project JSON, action names, or submission-project result persistence. 4. Add one focused provider probe test for cross-domain render isolation, action identity, and unchanged slice references; retain existing critical persistence coverage without layout assertions. 5. Verify focused project/persistence tests, strict TypeScript, full frontend suite, production renderer/Electron/preload build, diff hygiene, and independent review; record exact evidence and move to Human Review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented one internal projects owner with memoized navigation, list/meta, asset, Editor timeline, Director timeline, and GenSpace handoff contexts. Migrated App, Home, Project, GenSpace, Director, and Video Editor production consumers from broad useProjects(). Preserved Project schema, persisted JSON, action semantics, project-scoped submission persistence, and retake lookup. Frozen stable empty fallbacks. Independent review found and correction removed a stale active-timeline read by deriving Video Editor state from reactive timelines plus activeTimelineId; re-review verdict: ship. Verification: corepack pnpm typecheck:ts (pass); corepack pnpm test:frontend -- frontend/contexts/ProjectContext.test.ts frontend/views/genspace/hooks/useGenSpaceResultPersistence.test.tsx (41 files, 163 tests pass); corepack pnpm build:frontend (renderer, Electron main, preload pass); git diff --check (pass). No layout/class-name tests, runtime dependency, schema, or documentation contract change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Isolated project state into stable domain contexts and migrated hot workspace consumers, preventing unrelated asset, Editor, and Director updates from invalidating each other. Added render/callback/active-timeline probe coverage and retained submission-project persistence. TypeScript, 163 frontend tests, production renderer/Electron/preload build, diff hygiene, and independent ship review pass. User approved on 2026-08-05.
<!-- SECTION:FINAL_SUMMARY:END -->
