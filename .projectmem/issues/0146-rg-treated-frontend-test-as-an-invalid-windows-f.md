# #0146 rg treated frontend/test* as an invalid Windows filename while locating Vitest setup

- 2026-08-20T19:24:50Z `issue`: rg treated frontend/test* as an invalid Windows filename while locating Vitest setup [frontend test investigation]
- 2026-08-20T19:25:16Z `attempt`: Retried rg without wildcard path arguments and then located vitest.config.ts through rg --files [frontend test investigation] (worked)
- 2026-08-20T19:25:25Z `fix`: Avoided wildcard path arguments on Windows and used rg --files filtering [frontend test investigation]
