# #0504 Vite dev server cannot bind default port 5173 because Windows excludes TCP range 5141-5240

- 2026-08-03T13:25:15Z `issue`: Vite dev server cannot bind default port 5173 because Windows excludes TCP range 5141-5240 [frontend validation tooling / Windows TCP port reservation]
- 2026-08-03T13:59:39Z `fix`: User confirmed port issue is solved; current Windows exclusions no longer include 5173 and app loads [frontend validation tooling / Windows TCP port reservation]
