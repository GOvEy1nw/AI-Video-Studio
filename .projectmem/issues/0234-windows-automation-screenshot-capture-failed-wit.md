# #0234 Windows automation screenshot capture failed with IGraphicsCaptureItemInterop.CreateForMonitor 0x80070057 during Phase 2 dev smoke

- 2026-07-26T19:55:03Z `issue`: Windows automation screenshot capture failed with IGraphicsCaptureItemInterop.CreateForMonitor 0x80070057 during Phase 2 dev smoke [Phase 2 Electron 43 native validation]
- 2026-07-26T19:55:13Z `attempt`: Retried accessibility-only capture, but reused failed binding without declaration and hit devState2 is not defined [Phase 2 Electron 43 native validation] (failed)
- 2026-07-26T19:55:24Z `attempt`: Accessibility-only window state succeeded and exposed full AiVS tree; screenshot capture remains unavailable [Phase 2 Electron 43 native validation] (partial)
- 2026-07-26T19:55:33Z `attempt`: Activated AiVS and retried screenshot capture; Windows automation failed with GetCursorPos access denied 0x80070005 [Phase 2 Electron 43 native validation] (failed)
- 2026-07-26T19:58:05Z `attempt`: Element click and keyboard injection both fail with GetCursorPos access denied; accessibility reads work but computer-use input is blocked [Phase 2 Electron 43 native validation] (failed)
- 2026-07-26T19:58:48Z `attempt`: Tried launching a temporary CMD wrapper through computer-use; API rejected non-executable launch targets [Phase 2 Electron 43 native validation] (failed)
- 2026-07-26T19:59:15Z `attempt`: Tried compiling a temporary same-integrity launcher; legacy csc could not generate Win32 resources in managed C:\tmp sandbox [Phase 2 Electron 43 native validation] (failed)
- 2026-07-26T20:03:02Z `attempt`: Relaunched dev command through a compiled temporary same-integrity launcher; screenshot, accessibility, click, and keyboard control now work [Phase 2 Electron 43 native validation] (worked)
- 2026-07-26T20:03:08Z `fix`: Native UI automation restored by launching Electron through the automation session's integrity level [Phase 2 Electron 43 native validation]
