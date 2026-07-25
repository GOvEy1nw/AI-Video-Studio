# #0126 PowerShell stripped quotes from the final rg alternation and produced an unclosed regex group.

- 2026-07-25T11:00:11Z `issue`: PowerShell stripped quotes from the final rg alternation and produced an unclosed regex group. [frontend/views/genspace/]
- 2026-07-25T11:00:18Z `attempt`: Tried one quoted rg alternation for final line references; PowerShell removed the embedded quotes and rg rejected the regex. [frontend/views/genspace/] (failed)
- 2026-07-25T11:00:25Z `attempt`: Replaced the fragile regex with fixed-string rg patterns; final line references resolved successfully. [frontend/views/genspace/] (worked)
- 2026-07-25T11:00:28Z `fix`: Final source lookup now uses PowerShell-safe fixed-string ripgrep patterns. [frontend/views/genspace/]
