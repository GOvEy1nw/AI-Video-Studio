# #0152 Focused Music gallery Vitest run cannot read vitest.config.ts through the managed sandbox's esbuild process.

- 2026-07-25T22:37:47Z `issue`: Focused Music gallery Vitest run cannot read vitest.config.ts through the managed sandbox's esbuild process. [vitest.config.ts]
- 2026-07-25T22:37:50Z `attempt`: Ran the installed Vitest executable directly; esbuild was denied parent-directory/config access before tests started. [vitest.config.ts] (failed)
- 2026-07-25T22:38:03Z `attempt`: Reran the focused Vitest command through the approved config-access route; both Music panel and stacked gallery tests passed. [vitest.config.ts] (worked)
- 2026-07-25T22:38:06Z `fix`: Focused Music gallery validation passes through the approved Vitest route; no repository change was required. [vitest.config.ts]
