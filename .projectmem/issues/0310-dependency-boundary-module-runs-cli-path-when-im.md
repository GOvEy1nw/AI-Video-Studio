# #0310 Dependency-boundary module runs CLI path when imported by Node tests, which would set exit code 2

- 2026-07-27T15:57:37Z `issue`: Dependency-boundary module runs CLI path when imported by Node tests, which would set exit code 2 [scripts/check-dependency-boundaries.mjs]
- 2026-07-27T15:57:55Z `attempt`: Guarded dependency-boundary CLI dispatch so importing exported helpers does not execute command-line usage path [scripts/check-dependency-boundaries.mjs] (partial)
- 2026-07-27T15:58:14Z `attempt`: Ran boundary unit suite after import guard; all five Node tests passed without CLI side effects [scripts/check-dependency-boundaries.mjs] (worked)
- 2026-07-27T15:58:18Z `fix`: CLI dispatch now executes only when dependency-boundary module is the direct entry point [scripts/check-dependency-boundaries.mjs]
