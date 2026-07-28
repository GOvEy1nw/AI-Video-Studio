# #0070 First full dev launch creates a hidden Electron BrowserWindow; ready-to-show never exposes a targetable AiVS window despite renderer/backend success.

- 2026-07-22T17:21:28Z `issue`: First full dev launch creates a hidden Electron BrowserWindow; ready-to-show never exposes a targetable AiVS window despite renderer/backend success. [electron/window.ts:40]
- 2026-07-22T17:21:35Z `attempt`: Launched the full Electron dev stack; backend and renderer became healthy, but the main BrowserWindow remained hidden with no window handle for Computer Use. [electron/window.ts:40] (failed)
- 2026-07-22T17:22:28Z `attempt`: Restarted the warmed Electron dev stack; the AiVS window appeared and the user visually confirmed the redesigned Gen Space looks good. [electron/window.ts:40] (worked)
- 2026-07-22T17:22:32Z `fix`: Confirmed the Electron window and Gen Space sidebar after a warm dev restart; user visually approved the layout. [electron/window.ts:40]
