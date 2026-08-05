# #0614 AIVS-022 delayed path approval and recovery finally can cross deleted project lifetime after ID reuse

- 2026-08-05T15:30:21Z `issue`: AIVS-022 delayed path approval and recovery finally can cross deleted project lifetime after ID reuse [frontend/contexts/ProjectContext.tsx]
- 2026-08-05T15:41:12Z `attempt`: Scoped delayed approvals and recovery completion/finally to project lifetime and unique request token [frontend/contexts/ProjectContext.tsx] (worked)
- 2026-08-05T15:41:16Z `fix`: Deleted/recreated project IDs cannot inherit stale approval or have replacement recovery released by old finally [frontend/contexts/ProjectContext.tsx]
