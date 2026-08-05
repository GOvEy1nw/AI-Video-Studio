---
id: AIVS-020
title: Share backend lifecycle and curated model-profile loading
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 13:39'
labels:
  - audit
dependencies:
  - AIVS-018
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/03_PR_SHARED_BACKEND_LIFECYCLE_AND_MODEL_PROFILES.md
modified_files:
  - frontend/App.tsx
  - frontend/components/ModelPackManager.tsx
  - frontend/contexts/AppSettingsContext.tsx
  - frontend/contexts/BackendLifecycleContext.tsx
  - frontend/contexts/ModelProfilesContext.tsx
  - frontend/contexts/ModelProfilesContext.test.tsx
  - frontend/hooks/use-backend.ts
  - frontend/hooks/use-image-profiles.ts
  - frontend/views/DirectorEditor.tsx
  - frontend/views/director/DirectorWorkspacePanel.tsx
priority: high
type: enhancement
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 03. Replace duplicate backend-health subscriptions, profile requests, Electron model-pack reads, and fixed retry timers with one application-level owner.

This PR changes ownership, not the `/api/model-profiles` contract or the visible model list. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Exactly one backend-health IPC subscription exists in the renderer.
- [x] #2 Exactly one initial backend-health snapshot request exists.
- [x] #3 App Settings no longer owns a parallel lifecycle subscription.
- [x] #4 Opening a project causes one `/api/model-profiles` request and one `getModelPacks` request, not one per media/workspace hook.
- [x] #5 Director uses one enabled-profile array.
- [x] #6 Concurrent refreshes coalesce.
- [x] #7 No profile retry timer runs while the backend is dead/restarting.
- [x] #8 Last successful profiles remain visible during a transient backend restart.
- [x] #9 Model-pack completion refreshes all consumers consistently.
- [x] #10 Existing hook call sites keep a simple compatible API.
- [x] #11 Typecheck, focused provider tests, and production build pass.
- [x] #12 No UI placement or model-picker markup tests are added.
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
1. Centralize backend lifecycle status, snapshot, generation-safe health checks, and reconnect behavior in one provider while keeping useBackend compatible. 2. Make AppSettings consume shared lifecycle, then load curated profiles/model packs once through a lifecycle-gated provider with same-generation coalescing, retained last success, and stale-request rejection. 3. Preserve media profile hooks as thin selectors, pass Director's enabled profiles to its workspace, and queue one shared trailing refresh after model-pack mutations. 4. Protect singleton ownership, coalescing, restart retention, and stale-response behavior with three focused provider scenarios; verify TypeScript, frontend tests, production build, diff, and independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented application-level BackendLifecycleProvider and ModelProfilesProvider. Removed duplicate AppSettings health IPC ownership and per-hook profile/model-pack loaders. Preserved useBackend/useImageProfiles/useVideoProfiles/useMusicProfiles compatibility. Director now passes one enabled-profile array. Model-pack mutations queue one generation-safe shared refresh. Lifecycle generations reject stale health/profile completions; loaded settings/profiles remain visible through restart. Verification: corepack pnpm typecheck:ts (pass); corepack pnpm test:frontend -- frontend/contexts/ModelProfilesContext.test.tsx (40 files, 161 tests passed); corepack pnpm build:frontend (renderer, Electron main, preload passed); git diff --check (pass); singleton source scan confirmed one runtime health subscription/snapshot and one profile endpoint owner. Independent reviewer final verdict: ship. Native Electron restart/model-pack IPC smoke not run; no UI markup changed.

Published implementation commit f3521c2 (perf(frontend): share backend lifecycle and model profiles) to origin/codex/aivs-020-shared-backend-lifecycle. Local and upstream HEAD match; isolated worktree clean.

User accepted AIVS-020 on 2026-08-05. Validated combined AIVS-019/AIVS-020 integration on dev with corepack pnpm typecheck:ts, 162/162 frontend tests, and corepack pnpm build:frontend; integrated via merge commit 9797ea8.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Centralized backend lifecycle and curated profile/model-pack loading behind app-level providers, retained compatibility hooks and restart state, removed duplicate Director/settings ownership, and made model-pack refresh generation-safe. Verified strict TypeScript, 161 frontend tests, production renderer/Electron/preload build, clean diff, singleton source scan, and independent ship review.
<!-- SECTION:FINAL_SUMMARY:END -->
