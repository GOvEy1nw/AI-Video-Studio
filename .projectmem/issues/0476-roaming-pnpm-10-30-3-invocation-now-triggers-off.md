# #0476 Roaming pnpm 10.30.3 invocation now triggers offline registry signature verification and blocks TypeScript validation

- 2026-08-02T12:44:52Z `issue`: Roaming pnpm 10.30.3 invocation now triggers offline registry signature verification and blocks TypeScript validation [frontend validation tooling]
- 2026-08-02T12:44:56Z `attempt`: Tried documented Roaming pnpm 10.30.3 path for typecheck:ts; package-manager shim attempted registry signature verification and failed offline [frontend validation tooling] (failed)
- 2026-08-02T12:45:21Z `attempt`: Ran repository's exact typecheck:ts payload directly through local TypeScript binary; strict TypeScript passed [frontend validation tooling] (worked)
- 2026-08-02T12:45:25Z `fix`: Bypassed offline pnpm shim with exact local tsc payload; strict TypeScript validation completed successfully [frontend validation tooling]
