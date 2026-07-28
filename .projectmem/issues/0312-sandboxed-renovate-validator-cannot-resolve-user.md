# #0312 Sandboxed Renovate validator cannot resolve user path and exits EPERM before downloading tooling

- 2026-07-27T15:59:20Z `issue`: Sandboxed Renovate validator cannot resolve user path and exits EPERM before downloading tooling [Phase 10 Renovate config validation; corepack pnpm dlx renovate@41.140.1]
- 2026-07-27T15:59:24Z `attempt`: Ran exact ephemeral Renovate 41.140.1 validator in managed sandbox; pnpm dlx failed on realpath C:\Users\rais [Phase 10 Renovate config validation] (failed)
- 2026-07-27T16:01:11Z `attempt`: Approved pnpm dlx fetched Renovate 41.140.1, but invocation selected renovate main binary; it required a GitHub token instead of running config validator [Phase 10 Renovate config validation] (failed)
- 2026-07-27T16:02:58Z `attempt`: Used pnpm dlx --package to select renovate-config-validator explicitly; Renovate 41.140.1 validated renovate.json successfully [renovate.json] (worked)
- 2026-07-27T16:03:02Z `fix`: Approved explicit Renovate validator route now validates Phase 10 config successfully [renovate.json]
