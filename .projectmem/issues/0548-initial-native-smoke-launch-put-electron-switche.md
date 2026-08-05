# #0548 Initial native smoke launch put Electron switches after app path, so isolated userData was not applied

- 2026-08-04T15:49:34Z `issue`: Initial native smoke launch put Electron switches after app path, so isolated userData was not applied [native Electron smoke launcher]
- 2026-08-04T15:49:49Z `attempt`: Stopped incorrectly launched Electron PID 19964 before UI interaction; relaunch with switches before app path pending. [native Electron smoke launcher] (partial)
- 2026-08-04T15:50:48Z `attempt`: Putting switches before app path still did not isolate state because app-paths.ts overwrites userData from LOCALAPPDATA during import. [electron/app-paths.ts] (failed)
- 2026-08-04T15:51:43Z `attempt`: Relaunched with isolated LOCALAPPDATA/APPDATA; isolated AiVS profile now contains Chromium caches, logs, project storage, and lockfile, proving real profile is untouched. [native Electron smoke launcher] (worked)
- 2026-08-04T15:51:50Z `fix`: Native smoke isolation uses LOCALAPPDATA/APPDATA overrides because app-paths.ts intentionally overrides Electron --user-data-dir. [native Electron smoke launcher]
