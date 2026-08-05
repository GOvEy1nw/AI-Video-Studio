# #0558 PowerShell parses unquoted @codex as splatting, so Backlog assignee argument is missing

- 2026-08-05T08:58:05Z `issue`: PowerShell parses unquoted @codex as splatting, so Backlog assignee argument is missing [Backlog CLI / PowerShell]
- 2026-08-05T08:58:08Z `attempt`: Ran backlog task edit with unquoted @codex; PowerShell removed the assignee token [Backlog CLI / PowerShell] (failed)
- 2026-08-05T08:58:47Z `attempt`: Quoted '@codex' in PowerShell; Backlog CLI accepted the assignee value [Backlog CLI / PowerShell] (worked)
- 2026-08-05T08:58:51Z `fix`: PowerShell Backlog commands now quote @codex assignee tokens [Backlog CLI / PowerShell]
