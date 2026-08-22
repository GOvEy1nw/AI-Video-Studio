# #0204 ctx_execute_file resolved a relative workspace path against the context-mode plugin directory.

- 2026-08-22T14:16:44Z `issue`: ctx_execute_file resolved a relative workspace path against the context-mode plugin directory. [investigation/tooling]
- 2026-08-22T14:17:04Z `attempt`: Retried ctx_execute_file with an absolute workspace path; plugin still treated its install directory as the project root and blocked access. [investigation/tooling] (failed)
- 2026-08-22T14:19:03Z `attempt`: Used ctx_execute with the repository cwd for bounded source extraction; workspace files were read successfully. [investigation/tooling] (worked)
- 2026-08-22T14:19:08Z `fix`: Worked around context-mode's incorrect relative root by using ctx_execute with an explicit repository cwd. [investigation/tooling]
