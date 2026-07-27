# #0317 Phase 10 frozen install aborts non-TTY node_modules relink unless CI mode is set

- 2026-07-27T16:19:41Z `issue`: Phase 10 frozen install aborts non-TTY node_modules relink unless CI mode is set [pnpm install --frozen-lockfile; Phase 10 validation]
- 2026-07-27T16:19:48Z `attempt`: Ran exact frozen install in managed non-TTY shell; pnpm aborted node_modules removal and requested CI=true [Phase 10 validation] (failed)
- 2026-07-27T16:21:41Z `attempt`: Retried frozen install with CI=true; pnpm removed node_modules then stalled for over 90 seconds with no package progress under restricted store/network access [Phase 10 validation] (failed)
- 2026-07-27T16:23:36Z `attempt`: Tried tasklist to identify stalled pnpm node process; managed host denied process enumeration [Phase 10 validation process recovery] (failed)
- 2026-07-27T16:26:29Z `attempt`: Stopped only stalled pnpm PID 49436, resolved existing v10 store, and restored 430 packages with frozen lockfile and zero downloads [Phase 10 validation] (worked)
- 2026-07-27T16:26:34Z `fix`: CI-mode frozen install succeeds deterministically through existing pnpm 10 store after scoped stalled-process recovery [Phase 10 validation]
