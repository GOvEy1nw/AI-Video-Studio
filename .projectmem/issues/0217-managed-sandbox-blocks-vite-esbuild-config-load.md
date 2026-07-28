# #0217 Managed sandbox blocks Vite/esbuild config load during Phase 1 dev restart

- 2026-07-26T18:21:51Z `issue`: Managed sandbox blocks Vite/esbuild config load during Phase 1 dev restart [vite.config.ts]
- 2026-07-26T18:24:11Z `attempt`: Reran corepack pnpm dev outside managed sandbox; Vite, Electron, and backend started [vite.config.ts] (worked)
- 2026-07-26T18:24:17Z `fix`: Confirmed Vite, Electron window, authenticated backend, and WanGP preload start outside sandbox [vite.config.ts]
