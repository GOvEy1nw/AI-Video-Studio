# #0122 Ordinary video submission readiness guard is buried after image fallbacks and omits the active generation lock

- 2026-08-19T17:14:21Z `issue`: Ordinary video submission readiness guard is buried after image fallbacks and omits the active generation lock [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-08-19T17:14:48Z `attempt`: Moved the ordinary video branch next to tools/retake and required both a selected installed compatible profile and no active generation [frontend/views/genspace/hooks/useGenSpaceController.tsx] (worked)
- 2026-08-19T17:15:27Z `fix`: Plain video generation now visibly shares the installed-compatible-profile and active-generation submission guards with tool/retake flows [frontend/views/genspace/hooks/useGenSpaceController.tsx]
