# #0515 Floating submenu test sees prior portaled menu because custom render host is not cleaned between tests

- 2026-08-03T14:37:29Z `issue`: Floating submenu test sees prior portaled menu because custom render host is not cleaned between tests [frontend/components/FloatingMenu.test.tsx]
- 2026-08-03T14:37:43Z `attempt`: Added explicit Testing Library cleanup after each floating-menu test [frontend/components/FloatingMenu.test.tsx] (partial)
- 2026-08-03T14:37:52Z `attempt`: Verified explicit cleanup removes stale portaled menu across tests [frontend/components/FloatingMenu.test.tsx] (worked)
- 2026-08-03T14:37:56Z `fix`: Floating menu tests now clean portaled DOM after each case; submenu portal interaction test passes [frontend/components/FloatingMenu.test.tsx]
