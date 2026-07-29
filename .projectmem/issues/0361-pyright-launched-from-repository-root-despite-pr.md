# #0361 Pyright launched from repository root despite --project backend, causing an unbounded whole-repo scan with no output.

- 2026-07-28T15:09:50Z `issue`: Pyright launched from repository root despite --project backend, causing an unbounded whole-repo scan with no output. [backend pyright validation]
- 2026-07-28T15:09:58Z `attempt`: Tried to interrupt root-scoped Pyright session with Ctrl+C; unified exec backend does not support process interrupt. [backend pyright validation] (failed)
- 2026-07-28T15:10:29Z `attempt`: Stopped only verified hung Pyright Node PID; mis-scoped validation process exited cleanly enough to retry from backend cwd. [backend pyright validation] (partial)
- 2026-07-28T15:10:45Z `attempt`: Reran uv run pyright from backend cwd; completed in 3 seconds with 0 errors and 0 warnings. [backend pyright validation] (worked)
- 2026-07-28T15:10:49Z `fix`: Backend Pyright must run with backend as cwd; correct invocation passes cleanly. [backend pyright validation]
