# #0079 context-mode ctx_execute_file cannot process the explicitly referenced external Wan2GP checkout because it enforces the AiVS workspace root.

- 2026-08-16T10:18:05Z `issue`: context-mode ctx_execute_file cannot process the explicitly referenced external Wan2GP checkout because it enforces the AiVS workspace root. [investigation/tooling]
- 2026-08-16T10:20:01Z `attempt`: Used direct read-only PowerShell processing in the explicitly referenced Wan2GP checkout after ctx_execute_file correctly refused the external path; extracted profile/API semantics successfully. [investigation/tooling] (worked)
- 2026-08-16T10:20:09Z `fix`: External Wan2GP inspection now uses direct read-only PowerShell while context-mode remains confined to AiVS; profile/API investigation completed. [investigation/tooling]
