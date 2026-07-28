# #0077 PowerShell stripped quoted rg alternation while locating GenSpace Music references, producing an invalid regex.

- 2026-07-23T14:44:02Z `issue`: PowerShell stripped quoted rg alternation while locating GenSpace Music references, producing an invalid regex. [frontend/views/GenSpace.tsx]
- 2026-07-23T14:44:06Z `attempt`: Ran one quoted rg alternation for GenSpace Music references; PowerShell removed embedded quotes and rg rejected the pattern. [frontend/views/GenSpace.tsx] (failed)
- 2026-07-23T14:44:13Z `attempt`: Reran the GenSpace Music lookup with a PowerShell-safe single-quoted regex; all relevant references were located. [frontend/views/GenSpace.tsx] (worked)
- 2026-07-23T14:44:18Z `fix`: GenSpace Music references were located using PowerShell-safe rg quoting. [frontend/views/GenSpace.tsx]
