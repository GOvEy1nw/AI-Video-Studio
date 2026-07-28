# #0272 Phase 6 rebuilt unpacked app cannot replace win-unpacked while previous test app holds output

- 2026-07-27T12:27:13Z `issue`: Phase 6 rebuilt unpacked app cannot replace win-unpacked while previous test app holds output [release/win-unpacked]
- 2026-07-27T12:27:17Z `attempt`: Rebuilt Phase 6 unpacked app after runtime token fix; electron-builder hit EPERM renaming win-unpacked.tmp over existing output [release/win-unpacked] (failed)
- 2026-07-27T12:28:01Z `attempt`: Process inspection found live development Electron/backend tree during packaging; exact root PID 51612 identified [release/win-unpacked; development process tree] (partial)
- 2026-07-27T12:31:50Z `attempt`: Rebuilt Phase 6 unpacked app after confirming no AiVS process remained; electron-builder replaced release/win-unpacked successfully [release/win-unpacked] (worked)
- 2026-07-27T12:32:00Z `fix`: Unpacked Phase 6 package now rebuilds successfully after prior output-holding app tree exited [release/win-unpacked]
