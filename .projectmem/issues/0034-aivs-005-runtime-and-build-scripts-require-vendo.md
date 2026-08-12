# #0034 AIVS-005 runtime and build scripts require vendored Wan2GP, preventing source externalization and safe packaged repair.

- 2026-08-12T09:49:39Z `issue`: AIVS-005 runtime and build scripts require vendored Wan2GP, preventing source externalization and safe packaged repair. [electron/python-setup.ts]
- 2026-08-12T09:52:49Z `attempt`: Initial PowerShell parser check command failed because its diagnostic interpolated a variable immediately before a colon; source scripts were not parsed. [scripts/ensure-wan2gp.ps1] (failed)
- 2026-08-12T09:53:12Z `attempt`: All changed PowerShell scripts parse, but focused pytest was blocked before execution by sandbox access denied to the uv sdist cache. [backend/tests/test_wangp_source.py] (partial)
- 2026-08-12T09:54:09Z `attempt`: Implemented Windows-only external-root resolution, transactional managed bootstrap, separate model storage, and installer packaging changes; focused source test and TypeScript check pass. [electron/python-setup.ts] (worked)
- 2026-08-12T09:54:57Z `attempt`: Frontend/Electron production bundle and external-root validation passed; follow-up script grep command had a malformed PowerShell-escaped regex after the build. [scripts/ensure-wan2gp.ps1] (partial)
- 2026-08-12T09:55:08Z `fix`: AIVS-005 externalizes WanGP source: Windows development validates a read-only configured checkout, packaged setup transactionally clones the configured AiVS branch into userData runtime storage, and models use userData storage. [electron/python-setup.ts]
