# #0091 Direct Vitest startup cannot read the repo config path inside the managed sandbox.

- 2026-07-24T20:05:31Z `issue`: Direct Vitest startup cannot read the repo config path inside the managed sandbox. [vitest.config.ts]
- 2026-07-24T20:05:58Z `attempt`: Reran the direct Vitest command with approved config-path access; both initial component tests passed. [vitest.config.ts] (worked)
- 2026-07-24T20:06:01Z `fix`: Approved direct Vitest route resolves the config and executes frontend tests successfully. [vitest.config.ts]
- 2026-07-24T21:34:59Z `attempt`: Direct Vitest run again hit the managed sandbox esbuild config-directory access denial. [vitest.config.ts] (failed)
- 2026-07-24T21:35:22Z `attempt`: Reran Vitest with approved unsandboxed config access; all 18 tests passed. [vitest.config.ts] (worked)
