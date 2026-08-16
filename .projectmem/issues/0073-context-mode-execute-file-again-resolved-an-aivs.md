# #0073 context-mode execute_file again resolved an AiVS-relative path inside the plugin cache instead of the repository

- 2026-08-15T18:08:04Z `issue`: context-mode execute_file again resolved an AiVS-relative path inside the plugin cache instead of the repository [investigation/tooling]
- 2026-08-15T18:08:18Z `attempt`: Retried execute_file with an absolute workspace path, but the plugin still treated its own cache as the project root [investigation/tooling] (failed)
- 2026-08-15T18:21:11Z `attempt`: Used ctx_execute with an absolute path instead of execute_file and retrieved the required handler source [investigation/tooling] (worked)
- 2026-08-15T18:21:12Z `fix`: Absolute-path ctx_execute is the working fallback when context-mode execute_file loses the AiVS root [investigation/tooling]
