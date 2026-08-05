# #0608 AIVS-022 ProjectProvider can lose failed latest snapshots and rescans persisted asset paths after every project mutation.

- 2026-08-05T15:04:38Z `issue`: AIVS-022 ProjectProvider can lose failed latest snapshots and rescans persisted asset paths after every project mutation. [frontend/contexts/ProjectContext.tsx]
- 2026-08-05T15:07:50Z `attempt`: Added ordered latest-snapshot queue, serialized storage mutations, and batch persisted-path validation; provider migration still in progress. [frontend/contexts/project-persistence-queue.ts] (partial)
- 2026-08-05T15:13:31Z `attempt`: AIVS-022 queue, serialized storage, batch path validation, mutation-boundary persistence, and focused regressions pass strict TypeScript. [frontend/contexts/ProjectContext.tsx] (worked)
- 2026-08-05T15:13:34Z `fix`: Project persistence now queues latest snapshots with ordered retries and event-driven persisted path validation; focused tests and strict TypeScript pass. [frontend/contexts/ProjectContext.tsx]
