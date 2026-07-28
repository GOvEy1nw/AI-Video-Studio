# #0332 PowerShell expands multiline PR body into separate gh pr edit arguments instead of one --body value

- 2026-07-28T07:15:31Z `issue`: PowerShell expands multiline PR body into separate gh pr edit arguments instead of one --body value [Phase 11 draft PR evidence update]
- 2026-07-28T07:16:02Z `attempt`: Piped updated PR body to gh pr edit --body-file -, preserving multiline Markdown as stdin [Phase 11 draft PR evidence update] (worked)
- 2026-07-28T07:16:05Z `fix`: Draft PR #9 now records final SHA and successful hosted CI run using stdin-safe body update [Phase 11 draft PR evidence update]
