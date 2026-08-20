# #0141 Nested PowerShell variable expansion through rtk proxy removes the variable name when reading a plan range.

- 2026-08-20T17:54:04Z `issue`: Nested PowerShell variable expansion through rtk proxy removes the variable name when reading a plan range. [investigation/tooling]
- 2026-08-20T17:54:27Z `attempt`: Quoted the inner PowerShell command so rtk proxy preserved the range variable and completed full plan reading. [investigation/tooling] (worked)
- 2026-08-20T17:54:27Z `fix`: Nested PowerShell range reads work when the inner command is single-quoted. [investigation/tooling]
- 2026-08-20T19:09:36Z `attempt`: Nested PowerShell bulk class-replacement command lost loop variables; rerun inner command in single quotes. [investigation/tooling] (failed)
- 2026-08-20T19:09:59Z `attempt`: Single-quoted inner PowerShell command preserved variables and applied the scoped mechanical semantic-class sweep. [investigation/tooling] (worked)
