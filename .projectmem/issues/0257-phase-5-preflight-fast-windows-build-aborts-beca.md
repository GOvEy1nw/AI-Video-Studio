# #0257 Phase 5 preflight fast Windows build aborts because pnpm wants to recreate node_modules without a TTY

- 2026-07-27T11:05:49Z `issue`: Phase 5 preflight fast Windows build aborts because pnpm wants to recreate node_modules without a TTY [node_modules / scripts/local-build.ps1]
- 2026-07-27T11:05:55Z `attempt`: Ran corepack pnpm build:fast:win normally; install step stopped with ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY before packaging [node_modules / scripts/local-build.ps1] (failed)
- 2026-07-27T11:09:15Z `attempt`: Tried Win32 process command-line inspection to identify hung pnpm reinstall safely; managed sandbox denied Get-CimInstance [tooling/process-inspection] (failed)
- 2026-07-27T11:10:20Z `attempt`: Retried with CI=true; pnpm recreated node_modules then stalled without output under network-restricted sandbox, so exact pnpm install PID was stopped safely [node_modules / scripts/local-build.ps1] (failed)
- 2026-07-27T11:11:06Z `attempt`: Reran exact fast Windows build with CI=true and approved network/process access; pnpm restored 492 packages from store and unpacked packaging passed [node_modules / scripts/local-build.ps1] (worked)
- 2026-07-27T11:11:09Z `fix`: Phase 5 preflight fast Windows build passes via CI=true approved route; repository and lockfile unchanged [node_modules / scripts/local-build.ps1]
