# #0327 Primary Phase 11 frozen install recreates node_modules then stalls under restricted pnpm store access

- 2026-07-27T19:56:52Z `issue`: Primary Phase 11 frozen install recreates node_modules then stalls under restricted pnpm store access [Phase 11 frozen install]
- 2026-07-27T19:56:57Z `attempt`: Ran CI-mode Corepack frozen install in managed sandbox; pnpm removed node_modules and produced no package progress for 60 seconds [Phase 11 frozen install] (failed)
- 2026-07-27T19:58:16Z `attempt`: Reran unchanged CI-mode frozen install with approved existing-store access; 430 packages reused, zero downloaded [Phase 11 frozen install] (worked)
- 2026-07-27T19:58:20Z `fix`: Phase 11 primary frozen install completed deterministically from existing pnpm 10 store with no downloads [Phase 11 frozen install]
