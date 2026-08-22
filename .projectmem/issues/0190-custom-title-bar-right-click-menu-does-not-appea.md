# #0190 custom title-bar right-click menu does not appear; replace it with F5, Shift+F5, and F12 shortcuts

- 2026-08-21T11:01:13Z `issue`: custom title-bar right-click menu does not appear; replace it with F5, Shift+F5, and F12 shortcuts [electron/window.ts]
- 2026-08-21T11:03:06Z `attempt`: removed the title-bar context menu and handled exact F5, Shift+F5, and F12 keyDown events in Electron main [electron/window.ts] (worked)
- 2026-08-21T11:05:43Z `fix`: replaced the non-working title-bar context menu with exact Electron main-process F5, Shift+F5, and F12 shortcuts; typecheck, production build, and review pass [electron/window.ts]
