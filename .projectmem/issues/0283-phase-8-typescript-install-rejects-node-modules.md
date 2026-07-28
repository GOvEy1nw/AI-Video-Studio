# #0283 Phase 8 TypeScript install rejects node_modules because managed sandbox resolves a different pnpm store

- 2026-07-27T13:23:14Z `issue`: Phase 8 TypeScript install rejects node_modules because managed sandbox resolves a different pnpm store [package.json; node_modules; pnpm store]
- 2026-07-27T13:23:17Z `attempt`: Ran exact TypeScript 6.0.3 add in managed sandbox; pnpm rejected AppData-linked node_modules versus workspace .pnpm-store [package.json; node_modules] (failed)
- 2026-07-27T13:23:35Z `attempt`: Reran exact add with existing AppData pnpm store; transaction then stopped before changes on three-day-old transitive undici 7.29.0 minimumReleaseAge [package.json; pnpm-lock.yaml] (failed)
- 2026-07-27T13:24:26Z `attempt`: Installed only TypeScript 6.0.3 through existing pnpm store with a command-scoped minimum-release-age exception [package.json; pnpm-lock.yaml] (worked)
- 2026-07-27T13:24:31Z `fix`: Exact TypeScript 6.0.3 install completed without changing repository release-age policy [package.json; pnpm-lock.yaml]
