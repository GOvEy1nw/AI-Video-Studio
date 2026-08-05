# #0530 Renderer can set arbitrary project asset root that becomes an allowed filesystem root

- 2026-08-04T13:01:40Z `issue`: Renderer can set arbitrary project asset root that becomes an allowed filesystem root [electron/ipc/file-handlers.ts]
- 2026-08-04T13:02:19Z `attempt`: Documented arbitrary project-root expansion in audit and added native-picker/canonical-root requirements to PR06; production gap remains [docs/AiVS-Code-Health-Performance-Audit/06_PR_ASYNC_ELECTRON_FILE_AND_MEDIA_IO.md] (partial)
- 2026-08-04T13:39:08Z `attempt`: Removed renderer project-root setter in favor of main-owned canonical native picker; Settings preserves legacy-root reselection notice. [electron/ipc/file-handlers.ts] (partial)
- 2026-08-04T14:56:08Z `fix`: Project asset root changes now come only from Electron-main native directory selection and return canonical selected paths. [electron/ipc/file-handlers.ts]
