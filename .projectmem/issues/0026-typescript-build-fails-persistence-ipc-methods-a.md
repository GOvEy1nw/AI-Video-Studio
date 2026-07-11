# #0026 TypeScript build fails: persistence IPC methods are absent from Electron API renderer typing; GenSpace has unused formatAutoDuration import.

- 2026-07-10T16:13:14Z `issue`: TypeScript build fails: persistence IPC methods are absent from Electron API renderer typing; GenSpace has unused formatAutoDuration import. [frontend/contexts/ProjectContext.tsx]
- 2026-07-10T16:14:13Z `attempt`: Added persistence IPC methods to renderer Window typing and removed unused GenSpace duration formatter; TypeScript recheck pending. [frontend/vite-env.d.ts] (partial)
- 2026-07-10T16:14:24Z `fix`: Renderer persistence IPC methods are typed and unused GenSpace formatter removed; local tsc --noEmit passes. [frontend/vite-env.d.ts]
