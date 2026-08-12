# #0036 Unpacked Windows packaging failed when electron-builder could not rename release/win-unpacked.tmp due to EPERM.

- 2026-08-12T10:02:15Z `issue`: Unpacked Windows packaging failed when electron-builder could not rename release/win-unpacked.tmp due to EPERM. [release/win-unpacked]
- 2026-08-12T10:02:43Z `attempt`: Verified and removed only the generated release/win-unpacked.tmp directory before retrying packaging with filesystem permission. [release/win-unpacked.tmp] (partial)
- 2026-08-12T10:03:41Z `attempt`: Retried pnpm build:fast:win with release-directory write permission; electron-builder completed the unpacked Windows package. [release/win-unpacked] (worked)
- 2026-08-12T10:03:41Z `fix`: Unpacked Windows build succeeds when electron-builder may rename generated release directories. [release/win-unpacked]
