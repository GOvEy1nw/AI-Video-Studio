# #0247 Phase 2 fast packaging fails EPERM renaming win-unpacked.tmp to win-unpacked after gallery drop-zone rebuild

- 2026-07-27T08:54:59Z `issue`: Phase 2 fast packaging fails EPERM renaming win-unpacked.tmp to win-unpacked after gallery drop-zone rebuild [release/win-unpacked]
- 2026-07-27T08:55:03Z `attempt`: Rebuilt with build:fast:win outside sandbox; electron-builder completed bundles but EPERM blocked final win-unpacked.tmp rename. [release/win-unpacked] (failed)
- 2026-07-27T08:55:59Z `attempt`: Exact build:fast:win retry failed identically at win-unpacked.tmp directory rename; no release-path process was running. [release/win-unpacked] (failed)
- 2026-07-27T08:56:37Z `attempt`: Reversible rename probe was denied inside managed sandbox; permissions are otherwise full and local open-handle tracking is unavailable. [release/win-unpacked.tmp] (failed)
- 2026-07-27T08:57:01Z `attempt`: Same exact directory rename succeeds immediately outside the build after process exit, indicating transient in-build handle rather than ACL or persistent owner. [release/win-unpacked.tmp] (worked)
- 2026-07-27T08:57:41Z `attempt`: With dev Electron closed, build:fast:win completed and produced updated release/win-unpacked artifact. [release/win-unpacked] (worked)
- 2026-07-27T08:57:46Z `fix`: Closed running dev Electron before packaging; Electron Builder then renamed output and completed unpacked build. [release/win-unpacked]
