# #0117 context-mode ctx_execute_file again resolved the AiVS source outside its plugin workspace and blocked access

- 2026-08-19T16:12:47Z `issue`: context-mode ctx_execute_file again resolved the AiVS source outside its plugin workspace and blocked access [investigation/tooling]
- 2026-08-19T16:13:19Z `attempt`: Used ctx_execute with an absolute AiVS path to inspect the settings schema after ctx_execute_file rejected the workspace [investigation/tooling] (worked)
- 2026-08-19T16:13:27Z `fix`: Absolute-path ctx_execute is the reliable context-mode fallback for AiVS source inspection [investigation/tooling]
