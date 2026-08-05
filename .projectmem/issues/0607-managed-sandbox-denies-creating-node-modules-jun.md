# #0607 Managed sandbox denies creating node_modules junction in isolated AIVS-022 worktree

- 2026-08-05T15:03:10Z `issue`: Managed sandbox denies creating node_modules junction in isolated AIVS-022 worktree [C:\tmp\AI-Video-Studio-AIVS-022\node_modules]
- 2026-08-05T15:03:27Z `attempt`: Created isolated-worktree node_modules junction with approved filesystem access [C:\tmp\AI-Video-Studio-AIVS-022\node_modules] (worked)
- 2026-08-05T15:03:33Z `fix`: AIVS-022 isolated worktree now uses existing lockfile-matched node_modules junction for validation [C:\tmp\AI-Video-Studio-AIVS-022\node_modules]
