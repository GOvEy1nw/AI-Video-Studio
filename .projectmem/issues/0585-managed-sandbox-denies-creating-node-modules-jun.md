# #0585 Managed sandbox denies creating node_modules junction in isolated AIVS-020 worktree.

- 2026-08-05T12:35:59Z `issue`: Managed sandbox denies creating node_modules junction in isolated AIVS-020 worktree. [C:\tmp\AI-Video-Studio-AIVS-020 / node_modules]
- 2026-08-05T12:36:15Z `attempt`: Created lockfile-matched node_modules junction with approved filesystem access. [C:\tmp\AI-Video-Studio-AIVS-020 / node_modules] (worked)
- 2026-08-05T12:36:19Z `fix`: AIVS-020 isolated worktree now uses existing lockfile-matched node_modules junction and can run repository checks without dependency installation. [C:\tmp\AI-Video-Studio-AIVS-020 / node_modules]
