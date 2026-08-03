# #0508 PowerShell parsed quoted ripgrep alternation as pipeline while inventorying custom menus

- 2026-08-03T14:05:46Z `issue`: PowerShell parsed quoted ripgrep alternation as pipeline while inventorying custom menus [frontend source inspection tooling]
- 2026-08-03T14:05:51Z `attempt`: Tried one alternation-heavy rg pattern for menu and portal markers; PowerShell split it at the pipe [frontend source inspection tooling] (failed)
- 2026-08-03T14:05:59Z `attempt`: Retried menu inventory with PowerShell single-quoted rg pattern; command returned expected file list [frontend source inspection tooling] (worked)
- 2026-08-03T14:06:03Z `fix`: Use single-quoted PowerShell rg patterns when alternation contains pipe characters [frontend source inspection tooling]
