# #0368 Managed sandbox denies Get-NetTCPConnection, blocking PID inspection for local preview cleanup

- 2026-07-29T11:26:35Z `issue`: Managed sandbox denies Get-NetTCPConnection, blocking PID inspection for local preview cleanup [local renderer visual QA cleanup]
- 2026-07-29T11:26:43Z `attempt`: Stopped Vite preview cleanly through its interactive terminal after sandbox blocked port/PID inspection [local renderer visual QA cleanup] (worked)
- 2026-07-29T11:26:47Z `fix`: Local preview process exited via terminal command; no sandbox workaround or residual listener needed [local renderer visual QA cleanup]
