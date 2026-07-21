# #0060 final nested Wan2GP HEAD/status check failed under sandbox dubious-ownership protection without per-command safe.directory

- 2026-07-21T17:24:20Z `issue`: final nested Wan2GP HEAD/status check failed under sandbox dubious-ownership protection without per-command safe.directory [Wan2GP/.git]
- 2026-07-21T17:24:24Z `attempt`: ran nested git verification without the updater's per-command safe.directory override; sandbox rejected ownership [Wan2GP/.git] (failed)
- 2026-07-21T17:24:34Z `attempt`: repeated nested HEAD/status verification with a per-command safe.directory override; exact target HEAD and clean detached checkout confirmed [Wan2GP/.git] (worked)
- 2026-07-21T17:24:37Z `fix`: verified nested Wan2GP state using scoped safe.directory without changing global Git configuration [Wan2GP/.git]
