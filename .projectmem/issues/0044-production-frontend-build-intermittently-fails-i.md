# #0044 Production frontend build intermittently fails in the sandbox with Rolldown UNLOADABLE_DEPENDENCY access-denied errors reading existing Electron source modules.

- 2026-08-12T11:55:51Z `issue`: Production frontend build intermittently fails in the sandbox with Rolldown UNLOADABLE_DEPENDENCY access-denied errors reading existing Electron source modules. [electron/main.ts]
- 2026-08-12T11:56:00Z `attempt`: Sandboxed `rtk pnpm build:frontend` transformed renderer modules but failed when Rolldown was denied reads of multiple existing Electron source dependencies such as electron/csp.ts and electron/export/ffmpeg-utils.ts. [electron/main.ts] (failed)
- 2026-08-12T11:56:16Z `attempt`: Reran `rtk pnpm build:frontend` with source read access; renderer, Electron main, and preload bundles all built successfully. Only the existing >500 kB chunk-size warning remains. [electron/main.ts] (worked)
- 2026-08-12T11:56:21Z `fix`: Confirmed the build failure was sandbox file-read interference, not a product regression; production renderer, Electron main, and preload builds pass when run with the required workspace access. [electron/main.ts]
