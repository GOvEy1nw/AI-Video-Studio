# #0527 ripgrep Windows path glob for audit PR files failed with invalid filename syntax

- 2026-08-04T12:52:30Z `issue`: ripgrep Windows path glob for audit PR files failed with invalid filename syntax [audit inspection tooling]
- 2026-08-04T12:52:36Z `attempt`: Passed wildcard in Windows path argument to rg; rg treated it as literal invalid path [audit inspection tooling] (failed)
- 2026-08-04T12:52:45Z `attempt`: Moved PR filename wildcard into rg -g filter and searched the audit directory [audit inspection tooling] (worked)
- 2026-08-04T12:52:49Z `fix`: Use rg -g for Windows filename globs instead of embedding wildcard in path [audit inspection tooling]
