# #0024 Clean runtime preparation cannot start: pnpm refuses the locked 10.30.3 binary because registry signature fetch verification fails.

- 2026-07-10T15:47:32Z `issue`: Clean runtime preparation cannot start: pnpm refuses the locked 10.30.3 binary because registry signature fetch verification fails. [package.json]
- 2026-07-10T15:47:56Z `attempt`: Tried bundled pnpm; it aborted module purge without TTY then could not fetch pnpm metadata/install from registry. [package.json] (failed)
- 2026-07-10T15:48:13Z `attempt`: Direct preparation failed before download because sandbox Git rejects existing Wan2GP checkout ownership as dubious. [scripts/ensure-wan2gp.ps1] (failed)
- 2026-07-10T15:48:56Z `attempt`: Safe-directory fix passed ownership check, but script still fetches an already pinned checkout and network access to GitHub is blocked. [scripts/ensure-wan2gp.ps1] (failed)
- 2026-07-10T15:49:27Z `attempt`: Pinned checkout now verifies offline, but uv export cannot access its external cache under AppData Local in sandbox. [scripts/prepare-python.ps1] (failed)
- 2026-07-10T15:50:16Z `attempt`: Escalated clean prepare built embedded Python but uv export made pip resolve torch 2.10.0+cu130 from PyPI, where no matching wheel exists. [scripts/prepare-python.ps1] (failed)
- 2026-07-10T15:53:31Z `attempt`: Reordered GPU stack and generic dependencies; embedded runtime now imports torch 2.10.0+cu130, CUDA, FastAPI, Diffusers, and ltx_pipelines. Script nevertheless returned exit 1 after verification output. [scripts/prepare-python.ps1] (partial)
- 2026-07-10T15:58:18Z `attempt`: Runtime archive creation failed: tar could not read python-embed/Lib/site-packages/onnx/checker.cc due to permission denied. [scripts/create-python-runtime-assets.ps1] (failed)
- 2026-07-10T16:12:53Z `attempt`: Final pnpm typecheck cannot start: pnpm 10.30.3 registry signature verification fails before local scripts execute. [package.json] (failed)
- 2026-07-10T16:20:15Z `attempt`: Local Vite build is blocked by sandbox access to Vite config parent directory; no source error was reported. [vite.config.ts] (failed)
- 2026-07-10T18:17:55Z `attempt`: Elevated local Vite build completed: frontend, Electron main, and preload bundles built successfully. [vite.config.ts] (partial)
- 2026-07-10T18:19:39Z `attempt`: Unpacked Windows package reached Electron but failed when electron-builder downloaded a Windows helper: sandbox network EACCES. [electron-builder.yml] (failed)
- 2026-07-10T18:20:08Z `attempt`: Elevated electron-builder --win --dir succeeded and created release/win-unpacked. [electron-builder.yml] (partial)
- 2026-07-10T18:40:27Z `attempt`: Final electron-builder --win completed successfully, producing signed NSIS installer and blockmap after runtime asset verification. [electron-builder.yml] (worked)
- 2026-07-10T18:58:39Z `fix`: Replaced separate prebuilt runtime archive with bundled Python+pip+uv bootstrap; final compact installer builds and first-run installs pinned GPU dependencies automatically. [electron/python-setup.ts]
