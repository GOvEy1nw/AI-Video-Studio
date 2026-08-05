# #0540 Directory dialog approves canonical target but returns raw symlink path, breaking later validated search

- 2026-08-04T13:49:04Z `issue`: Directory dialog approves canonical target but returns raw symlink path, breaking later validated search [electron/ipc/file-handlers.ts]
- 2026-08-04T13:58:01Z `attempt`: Generic directory and file dialogs now return canonical approved paths. [electron/ipc/file-handlers.ts] (worked)
- 2026-08-04T14:56:32Z `fix`: Native project-root and external-file selections return canonical paths and only matched selections receive capabilities. [electron/ipc/file-handlers.ts]
