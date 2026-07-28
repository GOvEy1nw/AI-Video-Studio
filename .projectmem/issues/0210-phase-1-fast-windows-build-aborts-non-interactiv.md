# #0210 Phase 1 fast Windows build aborts non-interactively because pnpm 10 must recreate node_modules previously managed by global pnpm 11.

- 2026-07-26T17:18:28Z `issue`: Phase 1 fast Windows build aborts non-interactively because pnpm 10 must recreate node_modules previously managed by global pnpm 11. [node_modules / scripts/local-build.ps1]
- 2026-07-26T17:22:43Z `attempt`: Recreated node_modules with Corepack pnpm 10.30.3 using frozen lockfile; install completed successfully. [node_modules] (worked)
- 2026-07-26T17:22:46Z `fix`: Restored dependency tree under pinned pnpm 10.30.3; non-TTY version-mismatch reinstall gate no longer applies. [node_modules]
