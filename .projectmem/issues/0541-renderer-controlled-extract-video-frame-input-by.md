# #0541 Renderer-controlled extract-video-frame input bypasses Electron path validation

- 2026-08-04T14:25:48Z `issue`: Renderer-controlled extract-video-frame input bypasses Electron path validation [electron/ipc/video-processing-handlers.ts]
- 2026-08-04T14:26:54Z `attempt`: Validated extract-video-frame input through canonical allowed/exact path boundary before existence check or ffmpeg, with unapproved-path regression; awaiting verification. [electron/ipc/video-processing-handlers.ts] (partial)
- 2026-08-04T14:27:31Z `attempt`: Initial focused test failed during import because Vitest electron module lacked app.isPackaged; production fix not exercised. [electron/ipc/video-processing-handlers.test.ts] (failed)
- 2026-08-04T14:27:38Z `attempt`: Added narrow hoisted Electron mock so video-processing path-boundary unit can import without registering IPC; rerunning test. [electron/ipc/video-processing-handlers.test.ts] (partial)
- 2026-08-04T14:28:24Z `attempt`: extract-video-frame now validates canonical input before existence/ffmpeg; focused rejection test passes within 33-test boundary suite and frontend build passes. [electron/ipc/video-processing-handlers.ts] (worked)
- 2026-08-04T14:56:36Z `fix`: Frame extraction validates renderer-provided input before existence checks or ffmpeg access and exact-approves successful output. [electron/ipc/video-processing-handlers.ts]
