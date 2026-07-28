# #0226 Pre-bump TypeScript gate cannot see getPathForFile because renderer Window electronAPI is declared outside electron/preload.ts

- 2026-07-26T19:40:09Z `issue`: Pre-bump TypeScript gate cannot see getPathForFile because renderer Window electronAPI is declared outside electron/preload.ts [frontend/lib/native-file-path.ts]
- 2026-07-26T19:40:36Z `attempt`: Added optional getPathForFile to renderer-owned Window declaration; TypeScript rerun pending [frontend/vite-env.d.ts] (partial)
- 2026-07-26T19:40:49Z `attempt`: Renderer Window declaration now includes optional getPathForFile; strict TypeScript passes [frontend/vite-env.d.ts] (worked)
- 2026-07-26T19:40:56Z `fix`: Updated both renderer and preload Window electronAPI declarations; TypeScript gate confirmed [frontend/vite-env.d.ts]
