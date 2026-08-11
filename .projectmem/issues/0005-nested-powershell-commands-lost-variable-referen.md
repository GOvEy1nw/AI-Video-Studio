# #0005 Nested PowerShell commands lost variable references while checking backend/.venv and memory

- 2026-08-10T10:37:14Z `issue`: Nested PowerShell commands lost variable references while checking backend/.venv and memory [backend/.venv]
- 2026-08-10T10:37:22Z `attempt`: Ran nested powershell -Command checks through context-mode; outer PowerShell expanded inner variables and both inspections failed [backend/.venv] (failed)
- 2026-08-10T10:38:43Z `attempt`: Switched to a JavaScript filesystem inspection in context-mode; confirmed backend/.venv exists but has zero files and directories [backend/.venv] (worked)
- 2026-08-10T10:38:47Z `fix`: Avoid nested PowerShell variable expansion by using context-mode JavaScript for backend/.venv inspection [backend/.venv]
