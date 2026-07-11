# #0033 First-run UI and /api/models/download still invoke legacy standalone LTX/Z-Image model downloader instead of WanGP model acquisition.

- 2026-07-10T19:03:14Z `issue`: First-run UI and /api/models/download still invoke legacy standalone LTX/Z-Image model downloader instead of WanGP model acquisition. [backend/_routes/models.py]
- 2026-07-10T19:27:41Z `attempt`: Removed legacy standalone downloader routes, services, and hidden IC-LoRA panel. Residual IC-LoRA API DTO patch did not match current file, so no DTO changes applied in that attempt. (failed)
- 2026-07-10T19:32:09Z `fix`: Removed FirstRun model installation calls and /api/models routes, downloader handlers, direct pipeline services, IC-LoRA panel, stale downloader hook, and LTX/Fal key-page IPC. WanGP remains sole model acquisition and generation owner. Verified with Pyright, 150 pytest tests, TypeScript, and grep for stale runtime endpoints.
