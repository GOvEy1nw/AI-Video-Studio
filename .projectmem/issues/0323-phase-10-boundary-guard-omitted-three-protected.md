# #0323 Phase 10 boundary guard omitted three protected WanGP source/runtime installer paths listed in policy

- 2026-07-27T16:40:05Z `issue`: Phase 10 boundary guard omitted three protected WanGP source/runtime installer paths listed in policy [scripts/check-dependency-boundaries.mjs]
- 2026-07-27T16:40:11Z `attempt`: Added ensure-wan2gp PowerShell/shell installers and update-wangp.ps1 to protected path list with Windows/POSIX test coverage [scripts/check-dependency-boundaries.mjs] (partial)
- 2026-07-27T16:40:27Z `fix`: Boundary guard now covers every protected runtime/source installer path declared by Renovate policy; 5/5 tests and package guard pass [scripts/check-dependency-boundaries.mjs]
