# #0071 PowerShell stripped embedded rg quotes during final line-reference lookup, producing invalid regular expressions.

- 2026-07-22T17:22:51Z `issue`: PowerShell stripped embedded rg quotes during final line-reference lookup, producing invalid regular expressions. [frontend/views/GenSpace.tsx]
- 2026-07-22T17:22:57Z `attempt`: Combined final status and quoted rg patterns in one PowerShell command; the line-reference regex quoting was malformed. [frontend/views/GenSpace.tsx] (failed)
- 2026-07-22T17:23:08Z `attempt`: Used PowerShell-safe single-quoted rg patterns; final line references resolved successfully. [frontend/views/GenSpace.tsx] (worked)
- 2026-07-22T17:23:12Z `fix`: Final source line lookup now uses PowerShell-safe rg quoting. [frontend/views/GenSpace.tsx]
