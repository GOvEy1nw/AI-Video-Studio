# #0679 AIVS-028 Electron gate harness hangs after first launch because Browser.close/child termination does not yield a completed run.

- 2026-08-05T19:56:29Z `issue`: AIVS-028 Electron gate harness hangs after first launch because Browser.close/child termination does not yield a completed run. [artifacts/performance/aivs-028/measure-electron-gate.mjs]
- 2026-08-05T19:56:47Z `attempt`: Direct Electron child shutdown also terminates vite-plugin-electron dev server; subsequent CDP fetch waits without a renderer server. [artifacts/performance/aivs-028/measure-electron-gate.mjs] (failed)
- 2026-08-05T19:58:48Z `attempt`: Renderer-only Vite server started but default dependency scan traversed Python Gradio sources and stalled startup; configured optimizeDeps entry is required. [artifacts/performance/aivs-028/vite-renderer.config.ts] (partial)
- 2026-08-05T20:00:54Z `attempt`: Direct Electron launch loads renderer without preload bridge, so React crashes at BackendLifecycleProvider; use repository pnpm dev:debug lifecycle for valid preloaded Electron. [artifacts/performance/aivs-028/measure-electron-gate.mjs] (failed)
- 2026-08-05T20:02:03Z `attempt`: Windows Node cannot spawn pnpm.cmd directly from benchmark harness (spawn EINVAL). [artifacts/performance/aivs-028/measure-vite-electron-gate.mjs] (failed)
- 2026-08-05T20:04:56Z `attempt`: Built-bundle Electron CDP opened successfully but loaded http://localhost:5173 because app.isPackaged is false; no production file renderer without packaged build. [electron/config.ts; electron/window.ts] (failed)
