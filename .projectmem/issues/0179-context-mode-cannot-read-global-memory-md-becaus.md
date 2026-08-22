# #0179 context-mode cannot read global MEMORY.md because it is outside the project root

- 2026-08-21T09:38:40Z `issue`: context-mode cannot read global MEMORY.md because it is outside the project root [investigation/tooling]
- 2026-08-21T09:38:51Z `attempt`: Tried to filter global MEMORY.md through ctx_execute_file; context-mode rejected the out-of-project path [investigation/tooling] (failed)
- 2026-08-21T09:39:01Z `attempt`: Used sandbox-readable rg directly for the narrow global-memory lookup; the command completed without relevant hits [investigation/tooling] (worked)
- 2026-08-21T09:39:06Z `fix`: Use direct narrow rg for approved global memory paths because context-mode intentionally restricts reads to the project root [investigation/tooling]
