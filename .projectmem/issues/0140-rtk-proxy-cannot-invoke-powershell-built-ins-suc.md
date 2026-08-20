# #0140 RTK proxy cannot invoke PowerShell built-ins such as Get-Content, blocking instructed skill-file reads.

- 2026-08-20T17:53:06Z `issue`: RTK proxy cannot invoke PowerShell built-ins such as Get-Content, blocking instructed skill-file reads. [investigation/tooling]
- 2026-08-20T17:53:23Z `attempt`: Used rtk proxy with pwsh.exe to read the skill instructions instead of invoking the PowerShell built-in directly. [investigation/tooling] (worked)
- 2026-08-20T17:53:23Z `fix`: RTK command prefix works for PowerShell built-ins when executed through pwsh.exe. [investigation/tooling]
- 2026-08-20T19:07:19Z `attempt`: rtk proxy still cannot invoke Get-Content directly; use pwsh.exe for PowerShell built-ins. [investigation/tooling] (failed)
