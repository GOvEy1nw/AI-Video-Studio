# #0561 Managed sandbox blocks pnpm temp-file creation inside isolated C:\tmp worktree

- 2026-08-05T09:00:02Z `issue`: Managed sandbox blocks pnpm temp-file creation inside isolated C:\tmp worktree [C:\tmp\AI-Video-Studio-AIVS-018 / pnpm]
- 2026-08-05T09:00:05Z `attempt`: Ran pnpm --version in isolated worktree; pnpm failed EPERM creating its temporary file under worktree root [C:\tmp\AI-Video-Studio-AIVS-018 / pnpm] (failed)
- 2026-08-05T09:01:53Z `attempt`: Linked existing lockfile-matched node_modules and ran pnpm with approved access; TypeScript baseline executed successfully [C:\tmp\AI-Video-Studio-AIVS-018 / pnpm] (worked)
- 2026-08-05T09:01:56Z `fix`: Isolated worktree pnpm checks run with approved access and shared lockfile-matched node_modules junction [C:\tmp\AI-Video-Studio-AIVS-018 / pnpm]
