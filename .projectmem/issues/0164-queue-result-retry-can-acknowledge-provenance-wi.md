# #0164 Queue result retry can acknowledge provenance without replaying Director document/clip linkage, and can mutate a project that was deleted during output copy

- 2026-08-20T22:09:17Z `issue`: Queue result retry can acknowledge provenance without replaying Director document/clip linkage, and can mutate a project that was deleted during output copy [frontend/contexts/GenerationQueueContext.tsx]
- 2026-08-20T22:19:11Z `attempt`: Provenance retries now call linkPersistedOutput before acknowledgement, replaying Director document/timeline linkage without copying the output again. [frontend/contexts/GenerationQueueContext.tsx] (worked)
- 2026-08-20T22:19:18Z `fix`: Director provenance retry restores document linkage, skips recopy, waits project persistence, and then acknowledges; focused test passes. [frontend/contexts/GenerationQueueContext.tsx]
