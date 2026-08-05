# #0666 AIVS-027 residue inventory command used POSIX `exit 0`, which PowerShell does not provide.

- 2026-08-05T18:42:43Z `issue`: AIVS-027 residue inventory command used POSIX `exit 0`, which PowerShell does not provide. [AIVS-027 validation tooling]
- 2026-08-05T18:42:52Z `attempt`: Reran dormant-identifier inventory with PowerShell-compatible zero-match handling. [AIVS-027 validation tooling] (worked)
- 2026-08-05T18:42:53Z `fix`: AIVS-027 residue inventory command now handles zero matches correctly in PowerShell. [AIVS-027 validation tooling]
