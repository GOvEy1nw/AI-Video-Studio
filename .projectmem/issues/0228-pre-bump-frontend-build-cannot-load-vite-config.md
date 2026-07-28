# #0228 Pre-bump frontend build cannot load vite.config.ts inside managed sandbox because esbuild is denied parent-directory access

- 2026-07-26T19:41:30Z `issue`: Pre-bump frontend build cannot load vite.config.ts inside managed sandbox because esbuild is denied parent-directory access [electron/preload.ts]
- 2026-07-26T19:41:48Z `attempt`: Reran unchanged production build through approved route; renderer, Electron main, and CommonJS preload built [electron/preload.ts] (worked)
- 2026-07-26T19:41:51Z `fix`: Approved execution route bypassed host sandbox restriction; production build passed unchanged [electron/preload.ts]
