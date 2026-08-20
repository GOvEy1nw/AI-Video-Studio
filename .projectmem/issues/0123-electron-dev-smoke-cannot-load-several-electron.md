# #0123 Electron dev smoke cannot load several electron modules because sandboxed Vite gets Windows access-denied errors

- 2026-08-19T17:16:13Z `issue`: Electron dev smoke cannot load several electron modules because sandboxed Vite gets Windows access-denied errors [pnpm dev / Electron visual QA]
- 2026-08-19T17:17:07Z `attempt`: Reran pnpm dev outside the sandbox; Electron main/preload built and the real app launched successfully [pnpm dev / Electron visual QA] (worked)
- 2026-08-19T17:29:47Z `fix`: Electron QA succeeded after an approved unsandboxed launch with REMOTE_DEBUGGING_PORT=9222; rail, overlay, focus, favourites, and Styles interactions passed [pnpm dev / Electron visual QA]
