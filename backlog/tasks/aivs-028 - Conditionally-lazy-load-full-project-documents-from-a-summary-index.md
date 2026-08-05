---
id: AIVS-028
title: Conditionally lazy-load full project documents from a summary index
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 21:07'
labels:
  - audit
dependencies:
  - AIVS-021
  - AIVS-022
  - AIVS-024
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/11_PR_CONDITIONAL_LAZY_PROJECT_LOADING.md
modified_files:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/11_PR_CONDITIONAL_LAZY_PROJECT_LOADING.md
  - artifacts/performance/aivs-028/raw-results.json
priority: medium
type: enhancement
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 11. Stop reading/parsing every historical project document before Home can show the project list.

**Do not start implementation until the measurement gate passes.** This PR adds meaningful storage/state complexity and is unnecessary for users with a small project collection. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The measurement gate and before values are recorded.
- [ ] #2 Home project list loads from summaries without parsing every full project.
- [ ] #3 V1 storage migrates safely and atomically.
- [ ] #4 Opening a project loads only that document unless another is pinned/active.
- [ ] #5 Home cards use static thumbnails/placeholders and no video elements.
- [ ] #6 Active generation/project persistence remains project-safe across navigation.
- [ ] #7 Dirty/in-flight projects are never evicted.
- [ ] #8 Summary updates occur only after successful document persistence.
- [ ] #9 Startup/project-list median improves enough to justify the complexity; target at least 30% reduction in measured project-storage contribution.
- [ ] #10 Focused storage tests, typecheck, and production build pass.
- [x] #11 No UI layout tests are added.
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
1. Measure exact V1 project document loading against repository Project L at 1, 10, and 50 projects. 2. Capture native Electron renderer heap on Home with 50 project cards. 3. Compare both mandatory gate thresholds and retain raw evidence. 4. If either gate passes, implement lazy loading; otherwise document failed gate and close without production changes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Current dev 291d69b confirms V1 index stores only projectIds; loadStoredProjects concurrently reads/parses all documents; ProjectProvider migrates/recovers/approves every full project before Home; Home cards already render static img/placeholder only. No existing target-machine gate artifact or demonstrated user-pain evidence exists, so implementation is not yet eligible.

Gate evidence (2026-08-05): `artifacts/performance/aivs-028/raw-results.json` retains five-run raw samples and machine metadata. Repository Project L used 50 projects; active large project contained 2,000 assets, 1,000 clips across 20 tracks, and 1,000 audio variations. Exact V1 load/parse medians: 1 project 18.5462 ms / 1,389,862 bytes; 10 projects 14.0791 ms / 1,551,656 bytes; 50 projects 15.2870 ms / 2,270,776 bytes. Largest document: 1,389,862 bytes.

Native Electron/CDP Home observation after renderer GC: 50 project cards, one intentional hero video, 18 lazy/static images; `performance.memory.usedJSHeapSize` 25,266,088 bytes; runtime heap used 16,192,972 bytes. App-wide process working set excluded from renderer gate evidence.

Gate failed decisively: 15.2870 ms < 250 ms and 25.27 MB < 100 MB; no demonstrated user pain. Per task's mandatory condition, no production lazy-loading implementation is authorized. AC #2-#11 are not applicable because they describe the implementation path that the failed gate forbids.

Protocol limitation: five-run native app-start-to-Home and native `loadProjects` timings could not be captured. Clean dev launches reached CDP without the preload bridge; complete isolated unpacked build launched but did not expose requested CDP. Security review rejected persistent environment-controlled remote-debug instrumentation, and temporary source was reverted before build. Exact-algorithm five-run storage samples and native one-shot renderer heap remain the valid gate evidence.

Environment metadata completed in raw artifact: Windows 10.0.26100; i9-14900K; 127.8 GiB RAM; RTX 4070 Ti SUPER 16 GiB; fixed NTFS C: storage; Node 24.18.0; pnpm 10.30.3; Electron 43.2.0. `pnpm build:frontend` passed during evidence work. No production/configuration change remains.

Cleanup limitation: 35,150 generated package files were removed. Windows Restart Manager identifies Codex host PID 4940 as sole locker of two remaining local untracked artifacts: `artifacts/performance/aivs-028/build/.../default_app.asar` (111,073 B) and `build2/.../app.asar` (47,029,347 B). They are excluded from staging/commit and must be deleted after host releases handles.

User explicitly authorized auto-approval for AIVS-024 through AIVS-029. Independent final review verdict: ship. Accepting conditional no-op result and moving task to Done.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Conditional no-op closure. Measured repository Project L using exact V1 read/parse algorithm across five runs at 1/10/50 projects; 50-project median was 15.2870 ms for 2,270,776 bytes. Native Electron Home with 50 cards used 25,266,088 bytes post-GC renderer heap. Both mandatory gates failed (250 ms / 100 MB), so no lazy-loading production change was authorized. Raw evidence and environment metadata are retained in `artifacts/performance/aivs-028/raw-results.json`; audit updated. `pnpm build:frontend`, JSON evidence assertion, `git diff --check`, staged-scope check, and independent ship review passed. Repeated native startup/load timing remained blocked by preload/CDP environment and is documented. Two local generated `.asar` files remain untracked because Codex host PID 4940 holds them; staged diff excludes them and they require deletion after handle release.
<!-- SECTION:FINAL_SUMMARY:END -->
