# #0220 Installed-app accessibility inspection command failed with PowerShell empty-pipe parser error

- 2026-07-26T18:42:08Z `issue`: Installed-app accessibility inspection command failed with PowerShell empty-pipe parser error [Phase 1 installed-app smoke]
- 2026-07-26T18:42:26Z `attempt`: Rewrote inspection loop to collect rows before piping; command completed and showed Electron exposes only Chrome Legacy Window [Phase 1 installed-app smoke] (worked)
- 2026-07-26T18:42:28Z `fix`: PowerShell parser error fixed; installed Electron window confirmed opaque to Windows UI Automation [Phase 1 installed-app smoke]
