# #0549 Native smoke renderer cannot load because Windows reserved port 5173 and foreground Vite exits

- 2026-08-04T15:53:36Z `issue`: Native smoke renderer cannot load because Windows reserved port 5173 and foreground Vite exits [native Electron smoke dev server]
- 2026-08-04T15:54:06Z `attempt`: Hidden Start-Process node vite on port 3000 exited immediately; localhost:3000 refused connection. [native Electron smoke dev server] (failed)
- 2026-08-04T15:56:03Z `attempt`: Direct Electron launch with VITE_DEV_SERVER_URL unset still loads hardcoded localhost:5173 because app.isPackaged is false; dev smoke cannot bypass reserved port. [electron/window.ts] (failed)
- 2026-08-04T15:59:42Z `attempt`: Requested port-5173 retry could not start because interrupted packaging install had removed node_modules/vite before restoration. [native Electron smoke dev server] (failed)
- 2026-08-04T16:02:16Z `attempt`: Port 5173 started and Electron launched, but Vite watcher crashed with EBUSY because isolated profile lived under workspace and included locked Chromium Cookies file. [native Electron smoke dev server] (failed)
- 2026-08-04T16:03:59Z `attempt`: Moved isolated profile outside workspace watcher and retried requested port 5173; Vite reported ready and launched isolated Electron successfully. [native Electron smoke dev server] (worked)
- 2026-08-04T16:04:04Z `fix`: Native dev smoke runs on requested port 5173 with isolated LOCALAPPDATA/APPDATA located outside Vite watch root. [native Electron smoke dev server]
