# #0378 Pinned pnpm validation blocked by registry signature lookup failure in managed network

- 2026-07-29T13:51:57Z `issue`: Pinned pnpm validation blocked by registry signature lookup failure in managed network [frontend validation]
- 2026-07-29T13:52:54Z `attempt`: Ran focused Vitest through pinned pnpm; pnpm 11 could not verify/download project pnpm 10.30.3 [frontend validation] (failed)
- 2026-07-29T13:54:20Z `attempt`: Retried with pnpm 11 --pm-on-fail=ignore; pnpm exec dependency-status check spawned global pnpm which repeated signature failure [frontend validation] (failed)
- 2026-07-29T13:54:51Z `attempt`: Ran focused Vitest directly from node_modules/.bin, bypassing pnpm version-switch network path [frontend validation] (worked)
- 2026-07-29T13:56:58Z `fix`: Used installed node_modules binaries to run equivalent offline Vitest, TypeScript, and Vite checks without pnpm version switching [frontend validation]
