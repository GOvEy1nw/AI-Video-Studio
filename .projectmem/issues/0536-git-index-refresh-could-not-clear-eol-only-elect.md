# #0536 Git index refresh could not clear EOL-only electron/config.ts worktree status because managed workspace denied .git object database write.

- 2026-08-04T13:44:00Z `issue`: Git index refresh could not clear EOL-only electron/config.ts worktree status because managed workspace denied .git object database write. [.git/objects]
- 2026-08-04T13:44:06Z `attempt`: Ran git update-index --refresh for electron/config.ts; failed with insufficient permission to add .git object. [.git/objects] (failed)
- 2026-08-04T13:54:29Z `attempt`: Retried git update-index --refresh with approved .git access; command still returned dirty-path needs-update list and left config stat-only status [.git index metadata] (failed)
