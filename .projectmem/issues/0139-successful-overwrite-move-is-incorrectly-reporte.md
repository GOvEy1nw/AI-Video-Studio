# #0139 Successful overwrite move is incorrectly reported failed when old-backup cleanup exhausts retries

- 2026-08-20T17:07:47Z `issue`: Successful overwrite move is incorrectly reported failed when old-backup cleanup exhausts retries [electron/lib/project-asset-import.ts]
- 2026-08-20T17:08:17Z `attempt`: Made post-success backup cleanup log-only and added restoration copy fallback with preserved backup details [electron/lib/project-asset-import.ts] (partial)
- 2026-08-20T17:08:49Z `fix`: Successful overwrite moves now survive backup-cleanup failure; native 16-test regression, TS, and production build pass [electron/lib/project-asset-import.ts]
