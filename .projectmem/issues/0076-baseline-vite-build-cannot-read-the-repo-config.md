# #0076 Baseline Vite build cannot read the repo config path inside the managed sandbox.

- 2026-07-23T14:42:21Z `issue`: Baseline Vite build cannot read the repo config path inside the managed sandbox. [vite.config.ts]
- 2026-07-23T14:42:25Z `attempt`: Ran the baseline direct Vite build in the managed sandbox; esbuild was denied access while resolving vite.config.ts. [vite.config.ts] (failed)
- 2026-07-23T14:42:55Z `attempt`: Reran the baseline Vite/Electron build with approved config access; all renderer, main, and preload bundles built successfully. [vite.config.ts] (worked)
- 2026-07-23T14:42:58Z `fix`: Baseline production build succeeds through the approved Vite route for renderer, Electron main, and preload. [vite.config.ts]
