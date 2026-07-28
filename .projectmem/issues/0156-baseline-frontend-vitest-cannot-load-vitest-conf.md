# #0156 Baseline frontend Vitest cannot load vitest.config.ts because managed sandbox denies esbuild parent-directory access.

- 2026-07-26T10:24:24Z `issue`: Baseline frontend Vitest cannot load vitest.config.ts because managed sandbox denies esbuild parent-directory access. [vitest.config.ts]
- 2026-07-26T10:24:27Z `attempt`: Ran the installed Vitest executable directly; esbuild was denied access while resolving the repository config before tests started. [vitest.config.ts] (failed)
- 2026-07-26T10:24:50Z `attempt`: Reran Vitest with approved config-resolution access; all 18 files and 56 tests passed. [vitest.config.ts] (worked)
- 2026-07-26T10:24:54Z `fix`: Baseline frontend suite passes through the approved Vitest route; no repository change was required. [vitest.config.ts]
- 2026-07-26T11:58:33Z `attempt`: Final direct Vitest run again hit the known managed-sandbox esbuild config access denial [vitest.config.ts] (failed)
- 2026-07-26T11:58:52Z `attempt`: Approved Vitest route passed all 28 files and 72 tests [vitest.config.ts] (worked)
