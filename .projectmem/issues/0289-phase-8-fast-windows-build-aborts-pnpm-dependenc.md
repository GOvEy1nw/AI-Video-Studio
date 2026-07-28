# #0289 Phase 8 fast Windows build aborts pnpm dependency relink without TTY/CI mode

- 2026-07-27T13:35:13Z `issue`: Phase 8 fast Windows build aborts pnpm dependency relink without TTY/CI mode [scripts/local-build.ps1; node_modules]
- 2026-07-27T13:35:17Z `attempt`: Ran repository fast Windows build; dependency install stopped with ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY [scripts/local-build.ps1] (failed)
- 2026-07-27T13:35:57Z `attempt`: Reran fast Windows build with CI mode through approved pnpm-store route; unpacked app packaged successfully [release/win-unpacked] (worked)
- 2026-07-27T13:36:00Z `fix`: CI-mode approved route completed Phase 8 fast Windows packaging [release/win-unpacked]
