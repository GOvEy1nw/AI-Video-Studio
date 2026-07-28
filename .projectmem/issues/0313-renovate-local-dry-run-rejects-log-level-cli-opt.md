# #0313 Renovate local dry-run rejects --log-level CLI option and exits before repository extraction

- 2026-07-27T16:04:24Z `issue`: Renovate local dry-run rejects --log-level CLI option and exits before repository extraction [Phase 10 Renovate dry-run]
- 2026-07-27T16:04:28Z `attempt`: Ran Renovate local extract dry-run with --log-level=debug; CLI rejected unsupported option after RE2 fallback warning [Phase 10 Renovate dry-run] (failed)
- 2026-07-27T16:05:08Z `attempt`: Retried with LOG_LEVEL env; local extract ran but ignored untracked renovate.json and exited nonzero because Renovate 41 only supports Node 22 [Phase 10 Renovate dry-run] (failed)
- 2026-07-27T16:12:10Z `attempt`: Used LOG_LEVEL environment variable and RENOVATE_CONFIG_FILE; Renovate local extract completed and loaded Phase 10 config [Phase 10 Renovate dry-run] (worked)
- 2026-07-27T16:12:15Z `fix`: Renovate debug dry-run now uses supported LOG_LEVEL environment variable and explicit config file [Phase 10 Renovate dry-run]
