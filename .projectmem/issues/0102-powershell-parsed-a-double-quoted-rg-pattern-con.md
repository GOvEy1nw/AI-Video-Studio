# #0102 PowerShell parsed a double-quoted rg pattern containing escaped TypeScript quotes as syntax instead of passing it to ripgrep.

- 2026-07-24T20:57:59Z `issue`: PowerShell parsed a double-quoted rg pattern containing escaped TypeScript quotes as syntax instead of passing it to ripgrep. [frontend/hooks/use-generation.ts]
- 2026-07-24T20:58:08Z `attempt`: Retried the source audit with PowerShell-safe single-quoted rg patterns; all requested references were collected. [frontend/hooks/use-generation.ts] (worked)
- 2026-07-24T20:58:14Z `fix`: Confirmed PowerShell-safe single-quoted ripgrep patterns avoid the parser error and return the source audit results. [frontend/hooks/use-generation.ts]
