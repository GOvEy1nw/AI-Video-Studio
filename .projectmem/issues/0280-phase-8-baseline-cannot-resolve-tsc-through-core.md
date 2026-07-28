# #0280 Phase 8 baseline cannot resolve tsc through corepack pnpm exec despite TypeScript being a direct dev dependency

- 2026-07-27T13:18:18Z `issue`: Phase 8 baseline cannot resolve tsc through corepack pnpm exec despite TypeScript being a direct dev dependency [package.json; node_modules/.bin]
- 2026-07-27T13:18:23Z `attempt`: Ran version and effective-config baseline via corepack pnpm exec tsc; Windows reported tsc not recognized for all three compiler commands [node_modules/.bin] (failed)
- 2026-07-27T13:18:44Z `attempt`: Invoked explicit local tsc.CMD; compiler resolved as 5.9.3, confirming only pnpm exec PATH resolution is broken [node_modules/.bin/tsc.CMD] (partial)
- 2026-07-27T13:25:06Z `attempt`: After TypeScript reinstall, pnpm exec still omitted node_modules/.bin; direct local tsc.CMD and package scripts remain reliable equivalents [node_modules/.bin/tsc.CMD; package.json] (worked)
- 2026-07-27T13:25:09Z `fix`: Phase 8 uses explicit local tsc.CMD for standalone compiler commands and repository package scripts for standard gates [node_modules/.bin/tsc.CMD; package.json]
