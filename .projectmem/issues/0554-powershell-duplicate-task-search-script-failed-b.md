# #0554 PowerShell duplicate-task search script failed because pipeline followed foreach statement directly

- 2026-08-05T08:35:12Z `issue`: PowerShell duplicate-task search script failed because pipeline followed foreach statement directly [Backlog task discovery tooling]
- 2026-08-05T08:35:19Z `attempt`: Piped foreach statement output directly into ConvertTo-Json; PowerShell parsed an empty pipe element [Backlog task discovery tooling] (failed)
- 2026-08-05T08:35:34Z `attempt`: Stored foreach results before piping to ConvertTo-Json; duplicate-task search completed for all audit PR titles [Backlog task discovery tooling] (worked)
- 2026-08-05T08:35:40Z `fix`: PowerShell duplicate-task search works by assigning foreach output before JSON conversion [Backlog task discovery tooling]
