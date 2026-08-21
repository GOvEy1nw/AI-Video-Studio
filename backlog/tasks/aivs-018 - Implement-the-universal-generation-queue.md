---
id: AIVS-018
title: Implement the universal generation queue
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-20 20:55'
updated_date: '2026-08-20 23:28'
labels: []
dependencies: []
documentation:
  - docs/AI-Video-Studio-Generation-Queue-Implementation-Plan.md
priority: high
type: feature
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a persistent backend-owned generation queue so users can submit mixed image, video, music, speech, SFX, upscale, retake, reframe, and Director work while generation is active, with global visibility and project-safe result recovery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All output-producing generation operations are admitted to one canonical backend queue and execute serially in FIFO order by default.
- [x] #2 Queued jobs can be moved or removed while pending, the active job can be cancelled, and a failed or cancelled job does not block later jobs.
- [x] #3 Submission is asynchronous, idempotent by client request ID, capacity-limited, and preserves immutable validated payload and client persistence context.
- [x] #4 Queue state is atomically persisted, queued work resumes after restart, active work becomes interrupted, and completed unacknowledged results remain recoverable.
- [x] #5 A global renderer queue surface shows active, pending, and recent terminal work with accessible reorder, remove, cancel, retry-attention, and dismiss or acknowledgement behavior.
- [x] #6 Generation results persist exactly once to the originating project and are acknowledged only after project persistence succeeds.
- [x] #7 No direct backend or frontend generation lifecycle bypass remains after migration, and WanGP remains the sole serial local inference runtime.
- [ ] #8 Focused backend and frontend queue contracts, TypeScript and Python type checks, the frontend production build, and one real mixed-queue Electron smoke scenario provide completion evidence.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [x] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Build backend queue contracts, canonical lifecycle, revisioned atomic store, idempotent admission, capacity handling, recovery conversion, retention, and focused pure lifecycle tests. Persist admission before returning 202; persist claims before dispatch; stop the queue as unhealthy if a required lifecycle save fails.
2. Add a job-scoped execution context and refactor image, video/tools, retake, Director, music, SFX, speech, and upscale handlers into worker-invoked execution methods. Keep preprocessing and cleanup with each domain; keep WanGP as the serial executor; bind every progress, cancellation, and terminal mutation to the active job ID.
3. Add the single worker/executor, runtime-ready gate, and explicit shutdown lifecycle. Prompt enhancement and lyric composition remain synchronous v1 helpers but must acquire or consult the same inference-lane ownership and return a clear busy response.
4. Add typed queue HTTP admission/list/detail/reorder/remove/cancel/acknowledgement routes and atomically cut all legacy generation routes over to queue-backed behavior without any direct execution path or response-contract mismatch.
5. Add one global GenerationQueueProvider/API client and accessible queue popover in App. It owns the only queue poller and exposes active, pending, recent terminal, reorder, remove, cancel, attention, and dismiss state.
6. Convert Quick Gen, Director, Retake, and Video Editor submission paths into immutable queued drafts. Preserve existing request builders, stable project/asset IDs, and compatible profile behavior; remove mutable submission refs and the independent useGenerationJob lifecycle. Generate remains enabled for valid submissions while work is active.
7. Extract modality-specific persistence into global job-ID-scoped result consumers. Copy outputs while unacknowledged, deduplicate by durable job/output provenance, wait for the exact ProjectPersistenceQueue save to resolve, validate complete output-index coverage with a generic receipt, then acknowledge; clean staging only after acknowledgement.
8. Remove obsolete global progress/cancel state and compatibility code, update enduring architecture documentation/project map, inspect all bypass searches and the complete diff, then run focused backend/frontend queue tests, TypeScript and Python type checks, frontend build, independent review, and an Electron mixed-queue/restart smoke when the runtime is available.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Current dev is two commits beyond the plan snapshot. The implementation must additionally cover DirectorWorkspacePanel and Video Editor useGapGeneration/useRegeneration persistence lanes, plus the separate use-retake hook.

Architecture commitment check required durability at lifecycle commit points, copy-not-move handling for unacknowledged outputs, complete generic acknowledgement receipts, an exact project-save await boundary, and an atomic legacy-route cutover.

Frontend mapping settled: mount one GenerationQueueProvider/result consumer inside ProjectProvider; use FloatingMenu for the toolbar popover; add optional job/output provenance to Asset and AssetTake; add a narrow copy-preserving generated-output IPC; add waitForPersistedRevision/awaitProjectPersistence instead of acknowledging after React mutation.

Existing useGapGeneration mixes submitted projectId for file copy with mutable currentProjectId for addAsset. Projectmem issue #0152 records this cross-project risk; AIVS-018 immutable job context must resolve it.

Backend queue slice implemented: canonical AppState-attached revisioned queue/store/worker, job-scoped GenerationHandler compatibility, readiness/shutdown/recovery, generic queue API, queue-backed legacy routes, helper-lane protection, typed complete-output acknowledgements, and bounded terminal pruning.

Backend evidence: `rtk uv run --offline pytest tests/test_generation_queue.py -q` 6 passed; `pnpm typecheck:py` 0 errors/warnings; `git diff --check` clean apart from CRLF conversion warnings. Live WanGP/GPU validation remains pending.

Implemented the universal generation queue end to end: durable atomic backend admission/claim/terminal/ack state; one FIFO worker and shared helper lane; queue-backed legacy adapters; global adaptive-polling renderer queue; immutable project-scoped submissions; modality-specific exactly-once result persistence; source-preserving output copy; exact project-save acknowledgement; provenance dedupe; accessible queue controls; and removal of the old renderer lifecycle.

Verification: backend queue tests `rtk uv run --offline pytest tests/test_generation_queue.py -q` passed 15/15; `pnpm typecheck:py`, `pnpm typecheck:ts`, `pnpm test:media-import`, `pnpm build:frontend`, `git diff --check`, and five focused frontend files (19/19 tests) passed. Production direct-output endpoint inventory found no bypasses.

Electron evidence: supported `pnpm dev` launched the real Electron app, authenticated backend, RTX 4070 Ti SUPER runtime, and WanGP preload successfully. A separate isolated Electron/CDP launch confirmed the preload bridge and global queue button rendered.

Remaining acceptance evidence: AC #8 explicitly requires a real interactive mixed-queue Electron scenario; that exact scenario was not run, so the task remains In Progress. The full frontend suite has 12 unchanged baseline failures across six unrelated files (248 tests passed), and the full backend suite was interrupted after producing no output; neither is represented as passing.
<!-- SECTION:NOTES:END -->
