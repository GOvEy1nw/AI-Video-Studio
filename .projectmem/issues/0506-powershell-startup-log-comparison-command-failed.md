# #0506 PowerShell startup-log comparison command failed with empty pipe after foreach block

- 2026-08-03T14:00:33Z `issue`: PowerShell startup-log comparison command failed with empty pipe after foreach block [startup log inspection tooling]
- 2026-08-03T14:00:37Z `attempt`: Piped foreach block directly to Format-List; PowerShell parsed empty pipeline element [startup log inspection tooling] (failed)
- 2026-08-03T14:01:18Z `attempt`: Assigned foreach output to a variable before formatting; startup-log comparison completed [startup log inspection tooling] (worked)
- 2026-08-03T14:01:21Z `fix`: Avoided direct pipe after foreach by storing rows before Format-List [startup log inspection tooling]
