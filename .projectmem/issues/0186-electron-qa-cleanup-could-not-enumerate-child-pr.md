# #0186 Electron QA cleanup could not enumerate child processes because Get-CimInstance Win32_Process was access denied

- 2026-08-21T10:18:15Z `issue`: Electron QA cleanup could not enumerate child processes because Get-CimInstance Win32_Process was access denied [tooling/electron-smoke]
- 2026-08-21T10:22:34Z `attempt`: stopped only Electron processes whose executable path is inside this repository node_modules [tooling/electron-smoke] (worked)
- 2026-08-21T10:22:38Z `fix`: cleaned up the launched Electron processes using repository-scoped executable paths [tooling/electron-smoke]
