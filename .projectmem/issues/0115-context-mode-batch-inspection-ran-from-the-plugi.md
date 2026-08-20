# #0115 context-mode batch inspection ran from the plugin workspace instead of AiVS, reporting main and plugin edits while backend paths were missing

- 2026-08-19T12:03:01Z `issue`: context-mode batch inspection ran from the plugin workspace instead of AiVS, reporting main and plugin edits while backend paths were missing [investigation/tooling]
- 2026-08-19T12:03:11Z `attempt`: Ran ctx_batch_execute with repository-relative git/rg commands; context-mode used its plugin cwd and returned unrelated plugin state plus missing backend paths [investigation/tooling] (failed)
- 2026-08-19T12:04:12Z `attempt`: Retried context-mode batch commands after explicitly Set-Location to the AiVS repository; branch, worktree, and backend searches resolved correctly [investigation/tooling] (worked)
- 2026-08-19T12:04:13Z `fix`: Prefix ctx_batch_execute shell commands with an explicit AiVS Set-Location when context-mode does not inherit the repository cwd [investigation/tooling]
