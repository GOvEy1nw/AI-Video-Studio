# #0238 Playwright Electron fallback could not reuse live AiVS userData; lock and DevToolsActivePort creation failed with access denied

- 2026-07-26T20:08:59Z `issue`: Playwright Electron fallback could not reuse live AiVS userData; lock and DevToolsActivePort creation failed with access denied [Phase 2 Electron 43 renderer/preload validation]
- 2026-07-26T20:09:30Z `attempt`: Confirmed no Electron process remained; failure comes from Playwright worker access to live AppData path, not a stale process lock [Phase 2 Electron 43 renderer/preload validation] (partial)
- 2026-07-26T20:09:43Z `attempt`: Tried creating isolated C:\tmp userData path in managed sandbox; New-Item was denied [Phase 2 Electron 43 renderer/preload validation] (failed)
- 2026-07-26T20:10:47Z `attempt`: Tried --user-data-dir override; app-paths.ts resets Electron userData from LOCALAPPDATA, so Chromium switch did not change target [Phase 2 Electron 43 renderer/preload validation] (failed)
- 2026-07-26T20:11:41Z `attempt`: LOCALAPPDATA override let Playwright launch isolated Electron and verify preload bridge, but sandboxed child could not start venv base Python [Phase 2 Electron 43 renderer/preload validation] (partial)
- 2026-07-26T20:15:18Z `attempt`: Launched Electron through same-integrity temporary executable with CDP port, connected Playwright, and verified live userData renderer, preload bridge, and backend readiness [Phase 2 Electron 43 renderer/preload validation] (worked)
- 2026-07-26T20:15:22Z `fix`: Used same-integrity app launch plus CDP attachment instead of sandbox-spawned Electron; live AppData access and backend startup succeeded [Phase 2 Electron 43 renderer/preload validation]
