# #0024 Direct `pnpm exec electron .` smoke loads chrome-error because an unpackaged Electron main remains in development mode and expects the Vite server on localhost:5173.

- 2026-08-11T16:19:12Z `issue`: Direct `pnpm exec electron .` smoke loads chrome-error because an unpackaged Electron main remains in development mode and expects the Vite server on localhost:5173. [package.json]
- 2026-08-11T16:19:19Z `attempt`: Launched the built Electron main with a debugging port; preload existed but the renderer target was chrome-error because no Vite development server was running. [package.json] (failed)
- 2026-08-11T17:09:38Z `attempt`: Retried through the supported `pnpm dev` launcher; an actual `AiVS — AI Video Studio` Electron window opened, and the user completed the MiniMax H3 download through its model manager. [package.json] (worked)
- 2026-08-11T17:09:47Z `fix`: Electron smoke validation uses the supported `pnpm dev` workflow, which launches Vite and the real AiVS window together. [package.json]
