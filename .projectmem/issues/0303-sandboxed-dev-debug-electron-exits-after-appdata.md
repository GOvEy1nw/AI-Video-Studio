# #0303 Sandboxed dev:debug Electron exits after AppData lock and DevToolsActivePort writes are denied

- 2026-07-27T15:02:01Z `issue`: Sandboxed dev:debug Electron exits after AppData lock and DevToolsActivePort writes are denied [Electron dev:debug launch; C:\Users\rais\AppData\Local\AiVS]
- 2026-07-27T15:04:24Z `attempt`: Reran dev:debug with normal AppData access; Electron acquired user-data state, opened Node inspector 9229 and Chromium DevTools 9222, and began backend startup [Electron dev:debug launch; C:\Users\rais\AppData\Local\AiVS] (worked)
- 2026-07-27T15:04:29Z `fix`: Normal AppData access restores Electron dev:debug launch; sandbox denial was environmental, not application or dependency regression [Electron dev:debug launch; C:\Users\rais\AppData\Local\AiVS]
