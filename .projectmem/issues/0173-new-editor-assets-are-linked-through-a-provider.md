# #0173 New editor assets are linked through a provider projects ref that is stale until React rerenders, forcing avoidable failed first-pass persistence.

- 2026-08-20T22:47:45Z `issue`: New editor assets are linked through a provider projects ref that is stale until React rerenders, forcing avoidable failed first-pass persistence. [frontend/contexts/GenerationQueueContext.tsx]
- 2026-08-20T22:50:42Z `attempt`: Passed a newly persisted asset directly into editor result linking instead of relying on a stale provider project snapshot; focused consumer test passed. [frontend/contexts/GenerationQueueContext.tsx] (worked)
- 2026-08-20T22:50:46Z `fix`: Confirmed first-pass editor gap persistence can link the returned asset without provider-state refresh; focused consumer tests pass. [frontend/contexts/GenerationQueueContext.tsx]
