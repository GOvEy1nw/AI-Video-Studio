# #0546 Frame extraction returns unapproved OS-temp output after global temp authority removal

- 2026-08-04T14:47:40Z `issue`: Frame extraction returns unapproved OS-temp output after global temp authority removal [electron/ipc/video-processing-handlers.ts]
- 2026-08-04T14:49:19Z `attempt`: Exact-approved successful ffmpeg frame output before returning it and added handler-level regression; validation still pending. [electron/ipc/video-processing-handlers.ts] (partial)
- 2026-08-04T14:49:28Z `attempt`: Initial handler regression failed at import because child_process mock omitted module default export expected by transpilation. [electron/ipc/video-processing-handlers.test.ts] (failed)
- 2026-08-04T14:49:41Z `attempt`: Adjusted child_process mock to provide shared default and named spawnSync exports; rerun pending. [electron/ipc/video-processing-handlers.test.ts] (partial)
- 2026-08-04T14:49:53Z `attempt`: Handler regression reached path validation but fixture input lacked required exact approval; test must model a renderer-selected input capability. [electron/ipc/video-processing-handlers.test.ts] (failed)
- 2026-08-04T14:50:06Z `attempt`: Exact-approved test input to model legitimate native File selection before invoking extraction handler; rerun pending. [electron/ipc/video-processing-handlers.test.ts] (partial)
- 2026-08-04T14:50:21Z `attempt`: Handler-level regression passed: successful extraction returns OS-temp output that validatePath accepts only through exact approval. [electron/ipc/video-processing-handlers.test.ts] (worked)
- 2026-08-04T14:50:24Z `fix`: Successful frame extraction now canonicalizes and exact-approves its OS-temp output before returning renderer-visible path and URL. [electron/ipc/video-processing-handlers.ts]
- 2026-08-04T14:52:30Z `attempt`: Mocked config boundary in handler test so app-state provenance initialization cannot write token into repository cwd; cleanup verification pending. [electron/ipc/video-processing-handlers.test.ts] (partial)
- 2026-08-04T14:53:04Z `attempt`: Focused handler tests pass after config mock; provenance token artifact was removed and test no longer recreates it in repository cwd. [electron/ipc/video-processing-handlers.test.ts] (worked)
