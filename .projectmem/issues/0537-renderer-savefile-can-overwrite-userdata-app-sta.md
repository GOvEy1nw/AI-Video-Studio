# #0537 Renderer saveFile can overwrite userData app_state and forge project-root trust or exact-file approvals

- 2026-08-04T13:48:42Z `issue`: Renderer saveFile can overwrite userData app_state and forge project-root trust or exact-file approvals [electron/config.ts; electron/ipc/file-handlers.ts; electron/app-state.ts]
- 2026-08-04T13:57:51Z `attempt`: Separated exact write approval from read roots, moved gap temp writes to main-owned temporary IPC, and constrained export output writes; focused tests pass. [electron/path-validation.ts] (worked)
- 2026-08-04T14:56:19Z `fix`: Save/export writes now require an exact path approved by the native save dialog; broad userData write authority is removed. [electron/export/export-handler.ts]
