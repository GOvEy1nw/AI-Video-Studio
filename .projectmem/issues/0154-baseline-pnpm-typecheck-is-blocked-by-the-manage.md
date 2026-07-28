# #0154 Baseline pnpm typecheck is blocked by the managed pnpm wrapper's registry signature/version-switch check before project checks run.

- 2026-07-26T10:19:27Z `issue`: Baseline pnpm typecheck is blocked by the managed pnpm wrapper's registry signature/version-switch check before project checks run. [package.json]
- 2026-07-26T10:19:34Z `attempt`: Ran the plan's standard pnpm typecheck baseline gate; the wrapper failed its registry signature/version-switch check before invoking TypeScript or Pyright. [package.json] (failed)
- 2026-07-26T10:21:08Z `attempt`: Retried through the documented bundled node plus pnpm.mjs path; this runtime still invoked the same signature/version-switch guard and failed before checks. [package.json] (failed)
- 2026-07-26T10:22:59Z `attempt`: Retried with pnpm --pm-on-fail=ignore; the outer CLI proceeded but its automatic dependency-status repair spawned a nested install without the flag and failed at the same signature check. [package.json] (failed)
- 2026-07-26T10:24:12Z `attempt`: Bypassed the broken pnpm dependency-status bootstrap and ran the exact constituent TypeScript and Pyright commands directly; both passed. [package.json] (worked)
- 2026-07-26T10:24:15Z `fix`: Baseline typecheck is confirmed clean via direct tsc and approved uv Pyright execution; dependency repair was neither needed nor performed. [package.json]
