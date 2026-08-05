# #0555 Managed sandbox denies Backlog task-creation lock under .git/backlog.md

- 2026-08-05T08:37:20Z `issue`: Managed sandbox denies Backlog task-creation lock under .git/backlog.md [Backlog CLI task creation]
- 2026-08-05T08:37:25Z `attempt`: Bulk audit-task creation stopped at PR 01 before any task write because sandbox denied .git/backlog.md lock directory creation [Backlog CLI task creation] (failed)
- 2026-08-05T08:37:59Z `attempt`: Reran audit-task creation with approved .git metadata access; AIVS-018 through AIVS-029 created with translated dependencies [Backlog CLI task creation] (worked)
- 2026-08-05T08:38:05Z `fix`: Backlog audit task creation succeeds with approved repository metadata access [Backlog CLI task creation]
