# #0157 Baseline frontend build cannot load vite.config.ts because managed sandbox denies esbuild parent-directory access.

- 2026-07-26T10:25:28Z `issue`: Baseline frontend build cannot load vite.config.ts because managed sandbox denies esbuild parent-directory access. [vite.config.ts]
- 2026-07-26T10:25:32Z `attempt`: Ran the installed Vite build directly; esbuild was denied access while resolving vite.config.ts before compilation. [vite.config.ts] (failed)
- 2026-07-26T10:25:52Z `attempt`: Reran the Vite renderer/Electron/preload build with approved config-resolution access; all bundles completed successfully. [vite.config.ts] (worked)
- 2026-07-26T10:25:56Z `fix`: Baseline production build passes through the approved Vite route; no repository change was required. [vite.config.ts]
