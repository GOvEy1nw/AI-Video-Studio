# #0046 Nested PowerShell commands in context-mode expanded variables before the inner shell, breaking model-pack inspection.

- 2026-08-12T12:39:49Z `issue`: Nested PowerShell commands in context-mode expanded variables before the inner shell, breaking model-pack inspection. [investigation/tooling]
- 2026-08-12T12:39:56Z `attempt`: Used nested powershell -Command inside context-mode; outer PowerShell consumed inner variables and every inspection command failed to parse. [investigation/tooling] (failed)
- 2026-08-12T12:40:13Z `attempt`: Replaced nested PowerShell inspection with context-mode JavaScript, which parsed correctly and confirmed the guessed roots were not the active checkpoint store. [investigation/tooling] (worked)
- 2026-08-12T12:40:21Z `fix`: Use context-mode JavaScript directly for variable-heavy Windows inspection instead of nesting PowerShell commands. [investigation/tooling]
