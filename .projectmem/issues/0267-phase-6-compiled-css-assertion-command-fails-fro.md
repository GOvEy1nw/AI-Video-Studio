# #0267 Phase 6 compiled CSS assertion command fails from PowerShell quote escaping

- 2026-07-27T12:09:14Z `issue`: Phase 6 compiled CSS assertion command fails from PowerShell quote escaping [frontend/index.css]
- 2026-07-27T12:09:17Z `attempt`: Tried inline Node CSS assertions with nested quoted @source strings; PowerShell produced invalid JavaScript escape [frontend/index.css] (failed)
- 2026-07-27T12:09:34Z `attempt`: Simplified Node assertion quoting; CSS-first source/config/token/opacity checks all passed [frontend/index.css] (worked)
- 2026-07-27T12:09:36Z `fix`: Compiled CSS assertion command now avoids nested quote escapes and verifies nine CSS-first contracts [frontend/index.css]
