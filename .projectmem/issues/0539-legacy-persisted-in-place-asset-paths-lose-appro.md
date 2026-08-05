# #0539 Legacy persisted in-place asset paths lose approval after hardening and lack native re-selection recovery

- 2026-08-04T13:48:59Z `issue`: Legacy persisted in-place asset paths lose approval after hardening and lack native re-selection recovery [frontend/contexts/ProjectContext.tsx; renderer asset recovery]
- 2026-08-04T13:57:58Z `attempt`: Added one-session persisted project-file recovery request that only approves native-picker selections matching stored candidates. [electron/ipc/file-handlers.ts] (partial)
- 2026-08-04T14:00:14Z `attempt`: Added canonical candidate matching regression; recovery only returns native-picker files present in persisted project references. [electron/path-validation.test.ts] (worked)
- 2026-08-04T14:03:15Z `attempt`: Initial final recovery patch duplicated getProjectAssetsPathStatus import; Electron production build caught parse failure. [electron/ipc/file-handlers.ts] (failed)
- 2026-08-04T14:11:53Z `attempt`: Recovery now returns explicit outcomes, scopes candidates to active project, and retires only native-approved paths so cancelled/partial paths remain retryable after project switch. [frontend/contexts/ProjectContext.tsx] (worked)
- 2026-08-04T14:15:13Z `attempt`: Added current-project sequential recovery batches, deferred-path tracking, and cancel/partial retry regression; awaiting focused validation and review. [frontend/contexts/ProjectContext.tsx] (partial)
- 2026-08-04T14:17:50Z `attempt`: Sequential current-project recovery now retires only approved paths, defers cancel/error paths until reopen, and passes partial-selection retry regression (31 focused tests total). [frontend/contexts/ProjectContext.tsx] (worked)
- 2026-08-04T14:21:11Z `attempt`: Added recovery revision wake-up after in-flight request settles and provider race test for project switch plus cancel/reopen retry; awaiting validation. [frontend/contexts/ProjectContext.tsx] (partial)
- 2026-08-04T14:22:00Z `attempt`: Recovery revision wake-up passes provider race regression: project B recovers after project A dialog settles; cancel then leave/reopen retries deferred media. [frontend/contexts/ProjectContext.tsx] (worked)
- 2026-08-04T14:56:26Z `fix`: Persisted external media recovery uses native selection, partial approval, cancellation-safe deferral, project isolation, and retry after reopen/switch. [frontend/contexts/ProjectContext.tsx]
