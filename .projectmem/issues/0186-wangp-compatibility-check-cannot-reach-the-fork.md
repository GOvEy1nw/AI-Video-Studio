# #0186 WanGP compatibility check cannot reach the fork because managed sandbox blocks GitHub network access

- 2026-07-26T11:53:31Z `issue`: WanGP compatibility check cannot reach the fork because managed sandbox blocks GitHub network access [scripts/update-wangp.ps1]
- 2026-07-26T11:53:40Z `attempt`: Ran the documented direct PowerShell check-only script; git ls-remote failed because github.com:443 is blocked in the sandbox [scripts/update-wangp.ps1] (failed)
- 2026-07-26T11:53:58Z `attempt`: Reran the same read-only check with approved network access; fork head, bundled checkout, and manifest all resolve to c30e876 with no compatibility-sensitive changes [scripts/update-wangp.ps1] (worked)
- 2026-07-26T11:54:04Z `fix`: WanGP check-only compatibility gate passes with approved network access; checkout and manifest remain unchanged [scripts/update-wangp.ps1]
