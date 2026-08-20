# #0145 PowerShell quoting broke the combined rg regex while locating Testing Library imports

- 2026-08-20T19:23:24Z `issue`: PowerShell quoting broke the combined rg regex while locating Testing Library imports [frontend test investigation]
- 2026-08-20T19:23:51Z `attempt`: Retried with a single-quoted literal testing-library/react pattern [frontend test investigation] (worked)
- 2026-08-20T19:23:57Z `fix`: Used a literal single-pattern rg query to avoid nested PowerShell regex quoting [frontend test investigation]
