# #0571 Managed sandbox denies creating node_modules junction in isolated AIVS-019 worktree under C:\tmp.

- 2026-08-05T10:28:24Z `issue`: Managed sandbox denies creating node_modules junction in isolated AIVS-019 worktree under C:\tmp. [C:\tmp\AI-Video-Studio-AIVS-019 / pnpm setup]
- 2026-08-05T10:28:43Z `attempt`: Retried node_modules junction creation with approved access; linked isolated worktree to existing lockfile-matched dependencies. [C:\tmp\AI-Video-Studio-AIVS-019 / pnpm setup] (worked)
- 2026-08-05T10:28:48Z `fix`: AIVS-019 isolated worktree now uses the existing lockfile-matched node_modules junction and can run repository checks without dependency installation. [C:\tmp\AI-Video-Studio-AIVS-019 / pnpm setup]
