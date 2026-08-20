# #0149 `backlog instructions task-finalization --plain` rejected the unsupported `--plain` option.

- 2026-08-20T19:38:05Z `issue`: `backlog instructions task-finalization --plain` rejected the unsupported `--plain` option. [Backlog.md finalization workflow for AIVS-017]
- 2026-08-20T19:38:14Z `attempt`: Retried without `--plain`; the finalization guide was returned successfully. (worked)
- 2026-08-20T19:38:18Z `fix`: Backlog instruction commands do not accept `--plain`; use `backlog instructions <guide>` directly.
