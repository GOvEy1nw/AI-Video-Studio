# #0081 Managed sandbox blocks process enumeration needed to stop the temporary Vite/Electron QA runtime.

- 2026-07-23T16:06:58Z `issue`: Managed sandbox blocks process enumeration needed to stop the temporary Vite/Electron QA runtime. [vite.config.ts]
- 2026-07-23T16:07:01Z `attempt`: Queried workspace-scoped Node/Electron/Python processes in the sandbox; Win32 process access was denied. [vite.config.ts] (failed)
- 2026-07-23T16:07:20Z `attempt`: Repeated the workspace-scoped process query with approved access and identified only the temporary Vite PID 32016 and its Electron PID 29480 tree. [vite.config.ts] (worked)
- 2026-07-23T16:08:23Z `fix`: Approved workspace-scoped process enumeration enabled safe targeted cleanup and verified the temporary runtime is gone. [vite.config.ts]
