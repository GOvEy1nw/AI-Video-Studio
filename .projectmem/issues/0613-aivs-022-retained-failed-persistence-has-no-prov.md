# #0613 AIVS-022 retained failed persistence has no provider-level status or explicit retry path

- 2026-08-05T15:30:17Z `issue`: AIVS-022 retained failed persistence has no provider-level status or explicit retry path [frontend/contexts/project-persistence-queue.ts; frontend/contexts/ProjectContext.tsx]
- 2026-08-05T15:41:05Z `attempt`: Exposed provider persistence status and explicit retry; added hard-failure recovery regression [frontend/contexts/ProjectContext.tsx; frontend/contexts/project-persistence-queue.ts] (worked)
- 2026-08-05T15:41:09Z `fix`: Failed latest snapshot remains observable and explicitly retryable; successful retry clears persistence error [frontend/contexts/ProjectContext.tsx; frontend/contexts/project-persistence-queue.ts]
