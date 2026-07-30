# #0393 Local Vite dev server exited when Electron process hit Windows singleton lock, so browser smoke URL refused connection

- 2026-07-29T15:25:26Z `issue`: Local Vite dev server exited when Electron process hit Windows singleton lock, so browser smoke URL refused connection [frontend visual smoke tooling]
- 2026-07-29T15:25:38Z `attempt`: Switched visual smoke to built renderer via Vite preview; static server is running without Electron singleton startup [frontend visual smoke tooling] (partial)
- 2026-07-29T15:28:49Z `attempt`: Built renderer was reachable over LAN, but static preview cannot render without window.electronAPI; native-only startup crashed as expected outside Electron [frontend visual smoke tooling] (partial)
- 2026-07-29T15:33:40Z `attempt`: Native Electron launched and rendered crop-enabled build, but first gallery-to-slot drag did not attach selected image; continuing with another supported assignment path. [frontend native visual smoke] (partial)
- 2026-07-29T15:36:10Z `attempt`: Reused running Electron window, assigned gallery image through Use image, opened crop popover, selected 16:9, moved crop box, applied recipe, and restored empty slot. [frontend native visual smoke] (worked)
- 2026-07-29T15:36:14Z `fix`: Completed required native crop smoke using existing Electron window; crop hover action, anchored popover, ratio selection, crop-box movement, apply, and cleanup all verified. [frontend visual smoke tooling]
