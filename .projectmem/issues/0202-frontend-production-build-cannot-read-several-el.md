# #0202 Frontend production build cannot read several Electron source files inside the Windows sandbox.

- 2026-08-21T15:36:50Z `issue`: Frontend production build cannot read several Electron source files inside the Windows sandbox. [electron/main.ts]
- 2026-08-21T15:36:56Z `attempt`: Ran pnpm build:frontend in the sandbox; rolldown failed with os error 5 loading existing Electron dependencies. [electron/main.ts] (failed)
- 2026-08-21T15:37:12Z `attempt`: Reran the same production build outside the Windows read-restricted sandbox; renderer, main, and preload bundles passed. [electron/main.ts] (worked)
- 2026-08-21T15:37:18Z `fix`: Production build confirmed outside the Windows sandbox; failure was environmental file-read denial. [electron/main.ts]
