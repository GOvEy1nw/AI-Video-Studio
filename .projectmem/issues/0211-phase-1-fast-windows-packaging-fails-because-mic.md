# #0211 Phase 1 fast Windows packaging fails because Microsoft.PowerShell.Security cannot load for Get-AuthenticodeSignature on VC++ redistributable.

- 2026-07-26T17:23:48Z `issue`: Phase 1 fast Windows packaging fails because Microsoft.PowerShell.Security cannot load for Get-AuthenticodeSignature on VC++ redistributable. [scripts/create-installer.ps1]
- 2026-07-26T17:25:05Z `attempt`: Explicitly import Windows PowerShell 5.1 Microsoft.PowerShell.Security manifest before Authenticode validation; packaging verification pending. [scripts/create-installer.ps1] (partial)
- 2026-07-26T17:25:35Z `attempt`: Fast packaging passed VC++ Authenticode verification after explicit Windows PowerShell security-module import. [scripts/create-installer.ps1] (worked)
- 2026-07-26T17:25:42Z `fix`: Pinned Windows PowerShell 5.1 security-module manifest prevents PS7 module-path contamination while preserving Authenticode validation. [scripts/create-installer.ps1]
