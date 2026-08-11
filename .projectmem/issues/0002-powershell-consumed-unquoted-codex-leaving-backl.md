# #0002 PowerShell consumed unquoted @codex, leaving Backlog --assignee without a value

- 2026-08-10T08:43:06Z `issue`: PowerShell consumed unquoted @codex, leaving Backlog --assignee without a value [backlog/task-edit]
- 2026-08-10T08:43:17Z `attempt`: Ran task edit with unquoted @codex; PowerShell stripped the assignee argument [backlog/task-edit] (failed)
- 2026-08-10T08:43:30Z `attempt`: Quoted '@codex' in PowerShell; Backlog accepted the assignee and activated AIVS-001 [backlog/task-edit] (worked)
- 2026-08-10T08:43:34Z `fix`: Quote @-prefixed Backlog assignees in PowerShell commands [backlog/task-edit]
