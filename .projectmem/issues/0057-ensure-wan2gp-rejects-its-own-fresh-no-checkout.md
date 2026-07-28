# #0057 ensure-wan2gp rejects its own fresh --no-checkout clone as dirty because all tracked files are absent

- 2026-07-21T17:20:35Z `issue`: ensure-wan2gp rejects its own fresh --no-checkout clone as dirty because all tracked files are absent [scripts/ensure-wan2gp.ps1]
- 2026-07-21T17:21:06Z `attempt`: changed fresh clone to check out the configured branch instead of creating an intentionally empty worktree [scripts/ensure-wan2gp.ps1] (partial)
- 2026-07-21T17:22:57Z `attempt`: clean-clone validation completed: setup checked out AiVS, fetched the exact pin, and verified WanGP 12.34 [scripts/ensure-wan2gp.ps1] (worked)
- 2026-07-21T17:22:59Z `fix`: fresh setup clones the configured AiVS branch with a populated worktree before exact-pin verification [scripts/ensure-wan2gp.ps1]
