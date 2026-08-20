# #0138 Native overwrite move may delete an existing generated destination before a retried rename ultimately fails

- 2026-08-20T17:02:06Z `issue`: Native overwrite move may delete an existing generated destination before a retried rename ultimately fails [electron/lib/project-asset-import.ts]
- 2026-08-20T17:05:17Z `attempt`: Replaced destructive pre-unlink with backup, rollback, and cleanup around overwrite moves [electron/lib/project-asset-import.ts] (partial)
- 2026-08-20T17:06:33Z `fix`: Overwrite moves now preserve and restore an existing destination on transfer failure; focused collision regression passes [electron/lib/project-asset-import.ts]
