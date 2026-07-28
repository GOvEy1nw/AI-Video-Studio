# #0192 Focused backend tests cannot launch because the venv points to the managed uv Python outside the workspace sandbox

- 2026-07-26T12:48:15Z `issue`: Focused backend tests cannot launch because the venv points to the managed uv Python outside the workspace sandbox [backend/.venv/Scripts/python.exe]
- 2026-07-26T12:48:43Z `attempt`: Reran focused backend tests outside the sandbox; pytest launched successfully and exposed 6 behavior-expectation failures [backend/.venv/Scripts/python.exe] (worked)
- 2026-07-26T12:48:47Z `fix`: Backend pytest execution works outside the managed sandbox; test failures are tracked under the active feature correction [backend/.venv/Scripts/python.exe]
