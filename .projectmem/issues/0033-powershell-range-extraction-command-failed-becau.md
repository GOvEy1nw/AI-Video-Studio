# #0033 PowerShell range-extraction command failed because an interpolated file variable was followed by a colon.

- 2026-08-12T09:35:18Z `issue`: PowerShell range-extraction command failed because an interpolated file variable was followed by a colon. [investigation/tooling]
- 2026-08-12T09:35:50Z `attempt`: Retried range extraction using format-string interpolation; the command completed and indexed the requested source ranges. [investigation/tooling] (worked)
- 2026-08-12T09:35:50Z `fix`: Use PowerShell format strings when a variable is immediately followed by a colon. [investigation/tooling]
