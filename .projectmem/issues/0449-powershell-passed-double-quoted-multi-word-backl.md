# #0449 PowerShell passed double-quoted multi-word Backlog edit values as extra positional arguments; use single-quoted field values for this CLI invocation.

- 2026-08-01T15:08:01Z `issue`: PowerShell passed double-quoted multi-word Backlog edit values as extra positional arguments; use single-quoted field values for this CLI invocation. [Backlog CLI task editing]
- 2026-08-01T15:08:06Z `attempt`: Backlog edit with double-quoted multi-word fields was parsed as extra positional arguments. [Backlog CLI task editing] (failed)
- 2026-08-01T15:08:23Z `attempt`: Retried Backlog task edit with single-quoted PowerShell arguments; task status, owner, acceptance criteria, and plan updated. [Backlog CLI task editing] (worked)
- 2026-08-01T15:08:27Z `fix`: Use single-quoted field values when invoking Backlog edits from PowerShell. [Backlog CLI task editing]
