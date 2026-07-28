# #0290 Phase 9 frozen install aborts pnpm dependency relink without TTY/CI mode

- 2026-07-27T13:45:55Z `issue`: Phase 9 frozen install aborts pnpm dependency relink without TTY/CI mode [package.json; node_modules]
- 2026-07-27T13:46:02Z `attempt`: Ran Phase 9 frozen install normally; pnpm stopped before relinking with ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY [package.json; node_modules] (failed)
- 2026-07-27T13:48:28Z `attempt`: Retried frozen install with CI=true; pnpm entered node_modules recreation and produced no output for 90 seconds, while session interrupt was unsupported [package.json; node_modules] (failed)
- 2026-07-27T13:50:32Z `attempt`: Reran CI-mode frozen install with approved existing pnpm-store access; all 435 packages relinked from cache and lockfile stayed unchanged [package.json; node_modules] (worked)
- 2026-07-27T13:50:35Z `fix`: Approved CI-mode frozen install completed Phase 9 deterministic install preflight from existing pnpm store [package.json; node_modules]
