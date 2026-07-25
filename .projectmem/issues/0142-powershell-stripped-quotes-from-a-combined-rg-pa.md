# #0142 PowerShell stripped quotes from a combined rg pattern while searching for tab and scrollbar patterns.

- 2026-07-25T19:37:26Z `issue`: PowerShell stripped quotes from a combined rg pattern while searching for tab and scrollbar patterns. [frontend/]
- 2026-07-25T19:39:14Z `attempt`: Re-ran the pattern lookup as separate fixed-string rg searches, avoiding PowerShell quote stripping. [frontend/] (worked)
- 2026-07-25T19:39:19Z `fix`: Pattern audit completed with PowerShell-safe fixed-string searches. [frontend/]
