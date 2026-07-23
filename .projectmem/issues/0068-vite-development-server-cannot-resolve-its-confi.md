# #0068 Vite development server cannot resolve its config inside the managed sandbox, blocking browser layout QA.

- 2026-07-22T17:16:27Z `issue`: Vite development server cannot resolve its config inside the managed sandbox, blocking browser layout QA. [vite.config.ts]
- 2026-07-22T17:16:30Z `attempt`: Started the Vite dev server inside the managed sandbox; esbuild hit the same parent-directory access denial. [vite.config.ts] (failed)
- 2026-07-22T17:16:45Z `attempt`: Started the Vite dev server with approved config access; localhost is ready for browser layout QA. [vite.config.ts] (worked)
- 2026-07-22T17:25:00Z `fix`: Started the local Vite/Electron development stack with approved config access and completed visual QA. [vite.config.ts]
