# #0254 Phase 4 baseline Vitest cannot load vitest.config.ts inside managed sandbox; esbuild gets access denied

- 2026-07-27T10:40:32Z `issue`: Phase 4 baseline Vitest cannot load vitest.config.ts inside managed sandbox; esbuild gets access denied [vitest.config.ts]
- 2026-07-27T10:40:54Z `attempt`: Reran baseline with approved corepack pnpm exec vitest route; 22 files and 67 tests passed under Vitest 2.1.9 [vitest.config.ts] (worked)
- 2026-07-27T10:41:03Z `fix`: Approved Vitest execution route bypasses managed sandbox config access; Phase 4 baseline suite passes [vitest.config.ts]
