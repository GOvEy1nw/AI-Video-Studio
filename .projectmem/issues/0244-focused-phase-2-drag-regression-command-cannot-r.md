# #0244 Focused Phase 2 drag regression command cannot resolve vitest through current Corepack pnpm exec route

- 2026-07-27T08:45:58Z `issue`: Focused Phase 2 drag regression command cannot resolve vitest through current Corepack pnpm exec route [package.json]
- 2026-07-27T08:46:11Z `attempt`: Tried corepack pnpm exec vitest run for the focused drag test; Windows wrapper reported vitest not recognized while TypeScript and diff checks passed. [package.json] (failed)
- 2026-07-27T08:49:41Z `attempt`: Explicit vitest.CMD resolved the binary but managed sandbox blocked esbuild from loading vitest.config.ts; focused test did not start. [vitest.config.ts] (failed)
- 2026-07-27T08:50:04Z `attempt`: Explicit local vitest.CMD plus approved execution route resolved and launched focused Vitest; remaining failure is test-module alias collection, not command resolution. [node_modules/.bin/vitest.CMD] (worked)
- 2026-07-27T08:50:07Z `fix`: Use explicit local vitest.CMD under approved execution when Corepack pnpm exec cannot resolve the Windows Vitest shim. [node_modules/.bin/vitest.CMD]
