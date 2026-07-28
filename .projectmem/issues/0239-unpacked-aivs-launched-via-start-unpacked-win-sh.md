# #0239 Unpacked AiVS launched via start:unpacked:win shows uncaught main-process EPIPE after parent PowerShell pipe exits

- 2026-07-26T20:17:21Z `issue`: Unpacked AiVS launched via start:unpacked:win shows uncaught main-process EPIPE after parent PowerShell pipe exits [release/win-unpacked/AiVS.exe]
- 2026-07-26T20:18:11Z `attempt`: Stopped packaged logger console writes unless VITE_DEV_SERVER_URL is set; file logging remains unchanged [electron/logger.ts] (partial)
- 2026-07-26T20:20:20Z `attempt`: Rebuilt and relaunched after logger.ts guard; EPIPE persisted from python-backend direct process.stdout/stderr writes [electron/logger.ts] (failed)
- 2026-07-26T20:20:29Z `attempt`: Guarded python-backend console stream mirroring behind isDev while preserving packaged file logging and startup detection [electron/python-backend.ts] (partial)
- 2026-07-26T20:21:56Z `attempt`: Rebuilt and launched via start:unpacked:win; no Error dialog appeared and packaged renderer/backend reached Inference Engine Ready [electron/python-backend.ts] (worked)
- 2026-07-26T20:22:01Z `fix`: Packaged apps now keep backend logs on disk without writing to detached stdout/stderr; unpacked launch is clean [electron/logger.ts; electron/python-backend.ts]
