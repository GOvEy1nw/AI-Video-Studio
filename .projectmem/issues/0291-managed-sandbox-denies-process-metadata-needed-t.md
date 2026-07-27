# #0291 Managed sandbox denies process metadata needed to identify hung Phase 9 pnpm relink

- 2026-07-27T13:48:37Z `issue`: Managed sandbox denies process metadata needed to identify hung Phase 9 pnpm relink [tooling/process-inspection; node_modules]
- 2026-07-27T13:48:40Z `attempt`: Queried Win32 process command lines for exact frozen-install process; managed sandbox returned Access denied [tooling/process-inspection] (failed)
- 2026-07-27T13:49:31Z `attempt`: Approved process inspection identified exact frozen-install tree and pnpm PID 33684; stopped only that hung process [tooling/process-inspection; node_modules] (worked)
- 2026-07-27T13:49:35Z `fix`: Approved Win32 inspection restored exact process targeting; hung Phase 9 pnpm child was terminated without affecting other processes [tooling/process-inspection; node_modules]
