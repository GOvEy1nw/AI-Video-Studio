# #0059 PowerShell path inspection command parsed an empty pipeline after foreach output

- 2026-07-21T17:21:42Z `issue`: PowerShell path inspection command parsed an empty pipeline after foreach output [Wan2GP/]
- 2026-07-21T17:21:45Z `attempt`: piped foreach output directly to Format-Table; PowerShell rejected the expression [Wan2GP/] (failed)
- 2026-07-21T17:21:58Z `attempt`: assigned foreach results before formatting; inspection completed and showed only the original transient Wan2GP/.git remains [Wan2GP/] (worked)
- 2026-07-21T17:22:01Z `fix`: corrected PowerShell inspection shape and confirmed no partial backup directory exists [Wan2GP/]
