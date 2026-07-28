# #0193 Pyright cannot launch in the managed sandbox because the venv executable points to uv-managed Python outside the workspace

- 2026-07-26T12:50:56Z `issue`: Pyright cannot launch in the managed sandbox because the venv executable points to uv-managed Python outside the workspace [backend/.venv/Scripts/pyright.exe]
- 2026-07-26T12:51:13Z `attempt`: Reran Pyright outside the sandbox; it launched and reported three new strict typing errors [backend/.venv/Scripts/pyright.exe] (worked)
- 2026-07-26T12:51:20Z `fix`: Pyright validation now runs outside the managed sandbox; code-level typing failures remain under issue #0188 [backend/.venv/Scripts/pyright.exe]
