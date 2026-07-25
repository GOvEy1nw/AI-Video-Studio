# #0137 Backend virtualenv python launcher points to an unavailable uv-managed Python and cannot start focused Music tests.

- 2026-07-25T17:13:34Z `issue`: Backend virtualenv python launcher points to an unavailable uv-managed Python and cannot start focused Music tests. [backend/.venv/Scripts/python.exe]
- 2026-07-25T17:13:49Z `attempt`: Tried uv run as a fallback; managed sandbox denied access to uv cache metadata before pytest started. [backend/.venv/Scripts/python.exe] (failed)
- 2026-07-25T17:14:09Z `attempt`: Approved uv run accessed the managed interpreter/cache and completed the focused backend test run. [backend/.venv/Scripts/python.exe] (worked)
- 2026-07-25T17:14:12Z `fix`: Backend validation runs through approved uv instead of the stale virtualenv launcher. [backend/.venv/Scripts/python.exe]
