# #0151 Nested PowerShell variable expansion through RTK stripped plan-range variables during AIVS-018 packet read.

- 2026-08-20T21:06:01Z `issue`: Nested PowerShell variable expansion through RTK stripped plan-range variables during AIVS-018 packet read. [investigation/tooling]
- 2026-08-20T21:06:07Z `attempt`: Used nested PowerShell plan-range script; RTK stripped variables and parsing failed. [investigation/tooling] (failed)
- 2026-08-20T21:06:48Z `fix`: Read the queue packet using a single-quoted PowerShell command so RTK preserved range syntax. [investigation/tooling]
