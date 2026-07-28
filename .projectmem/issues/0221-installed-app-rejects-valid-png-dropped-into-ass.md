# #0221 Installed app rejects valid PNG dropped into Assets gallery as unsupported file type

- 2026-07-26T18:49:49Z `issue`: Installed app rejects valid PNG dropped into Assets gallery as unsupported file type [frontend/components/GalleryAssetLibrary.tsx]
- 2026-07-26T18:52:04Z `attempt`: Tried corepack pnpm exec electron --version; local electron binary was not exposed through pnpm exec [Phase 1 gallery drop diagnosis] (failed)
- 2026-07-26T18:54:44Z `attempt`: Approved user-mediated File.path before gallery import and added regression test for approval-before-copy ordering [frontend/lib/media-import.ts] (partial)
- 2026-07-26T18:54:56Z `attempt`: Focused Vitest launch failed inside sandbox because esbuild could not read workspace/config; same managed-environment limitation as #0217 [frontend/lib/media-import.test.ts] (failed)
- 2026-07-26T18:55:15Z `attempt`: Focused regression command ran outside sandbox; full frontend suite passed 57/57 including media-import approval-order test [frontend/lib/media-import.test.ts] (worked)
- 2026-07-26T18:55:31Z `attempt`: TypeScript validation caught incomplete electronAPI test stub cast; test object needs explicit unknown bridge [frontend/lib/media-import.test.ts] (failed)
- 2026-07-26T18:55:43Z `attempt`: Adjusted partial electronAPI test stub through explicit unknown bridge to satisfy strict structural typing [frontend/lib/media-import.test.ts] (partial)
- 2026-07-26T18:55:56Z `attempt`: Strict TypeScript check passed after test stub correction [frontend/lib/media-import.test.ts] (worked)
- 2026-07-26T18:56:14Z `attempt`: Frontend suite reran after final test edit and passed 57/57 [frontend/lib/media-import.test.ts] (worked)
- 2026-07-26T18:56:57Z `attempt`: Renderer, Electron main, and preload production bundles rebuilt successfully with drag/drop fix [frontend/lib/media-import.ts] (worked)
- 2026-07-26T18:58:28Z `attempt`: Full Windows installer rebuilt successfully at release\AiVS-Setup.exe (320.52 MB) with WanGP pin preserved [release\AiVS-Setup.exe] (worked)
- 2026-07-26T18:59:40Z `attempt`: Updated installer completed successfully with exit code 0 [release\AiVS-Setup.exe] (partial)
- 2026-07-26T19:03:54Z `attempt`: User repeated drag-gallery.png into installed Assets grid; import succeeded [Phase 1 installed-app smoke] (worked)
- 2026-07-26T19:04:00Z `fix`: Approved user-dropped File.path before native copy; installed gallery OS drag/drop now passes [frontend/lib/media-import.ts]
