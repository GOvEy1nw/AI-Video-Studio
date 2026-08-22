# #0194 Frontend production build failed because Vite/Rolldown was denied read access to multiple unchanged Electron source modules.

- 2026-08-21T12:20:15Z `issue`: Frontend production build failed because Vite/Rolldown was denied read access to multiple unchanged Electron source modules. [tooling/frontend-build]
- 2026-08-21T12:20:21Z `attempt`: Ran pnpm build:frontend in the managed workspace; Vite could not read eight unchanged Electron dependencies due to Windows access denied. [tooling/frontend-build] (failed)
- 2026-08-21T12:20:42Z `attempt`: Re-ran pnpm build:frontend outside the restrictive sandbox; renderer, Electron main, and preload bundles completed successfully. [tooling/frontend-build] (worked)
- 2026-08-21T12:20:46Z `fix`: The production build succeeds when granted access to unchanged Electron source modules outside the managed sandbox. [tooling/frontend-build]
