# #0610 AIVS-022 initial load can merge a locally created project without enqueueing its first save

- 2026-08-05T15:19:01Z `issue`: AIVS-022 initial load can merge a locally created project without enqueueing its first save [frontend/contexts/ProjectContext.tsx]
- 2026-08-05T15:22:28Z `attempt`: Guarded startup load with effect generation, preserved pre-ready local mutations/deletes, and added deferred-load plus Strict Mode regressions. [frontend/contexts/ProjectContext.tsx] (worked)
- 2026-08-05T15:22:34Z `fix`: Active startup load now queues local pre-ready snapshots after merge while leaving unchanged loaded projects unsaved; deferred-load regression passes. [frontend/contexts/ProjectContext.tsx]
- 2026-08-05T15:23:29Z `attempt`: Centralized pre-ready flush so active load failure/legacy completion also queues locally changed snapshots before marking storage ready; provider regression and TypeScript pass. [frontend/contexts/ProjectContext.tsx] (worked)
