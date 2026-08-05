# #0535 PowerShell rg command failed because vite.config.* wildcard was passed as a literal Windows path

- 2026-08-04T13:27:00Z `issue`: PowerShell rg command failed because vite.config.* wildcard was passed as a literal Windows path [test configuration inspection tooling]
- 2026-08-04T13:27:03Z `attempt`: Passed vite.config.* as a direct rg path while inspecting test configuration; Windows rejected literal wildcard path [test configuration inspection tooling] (failed)
- 2026-08-04T13:27:11Z `attempt`: Retried with rg -g filename filters; test configuration inspection succeeded [test configuration inspection tooling] (worked)
- 2026-08-04T13:27:17Z `fix`: Use rg -g filters for wildcard config names on Windows [test configuration inspection tooling]
