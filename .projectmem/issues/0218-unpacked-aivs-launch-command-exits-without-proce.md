# #0218 Unpacked AiVS launch command exits without process or visible window under managed sandbox

- 2026-07-26T18:27:03Z `issue`: Unpacked AiVS launch command exits without process or visible window under managed sandbox [release/win-unpacked/AiVS.exe]
- 2026-07-26T18:35:47Z `attempt`: Reran start:unpacked:win outside sandbox; packaged first-run setup, renderer, backend, projects, import, and settings passed [release/win-unpacked/AiVS.exe] (worked)
- 2026-07-26T18:35:52Z `fix`: Confirmed unpacked app starts outside sandbox and completes required packaged smoke checks [release/win-unpacked/AiVS.exe]
