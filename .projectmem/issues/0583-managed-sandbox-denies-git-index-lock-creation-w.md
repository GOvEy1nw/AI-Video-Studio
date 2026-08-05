# #0583 Managed sandbox denies Git index.lock creation while staging approved AIVS-019 files in isolated worktree.

- 2026-08-05T11:27:04Z `issue`: Managed sandbox denies Git index.lock creation while staging approved AIVS-019 files in isolated worktree. [C:\tmp\AI-Video-Studio-AIVS-019 / Git index]
- 2026-08-05T11:27:08Z `attempt`: Tried explicit-path git add in sandbox; linked worktree index.lock under main repository .git was denied. [C:\tmp\AI-Video-Studio-AIVS-019 / Git index] (failed)
- 2026-08-05T11:27:24Z `attempt`: Approved git add updated linked-worktree index and staged only explicit AIVS-019 paths. [C:\tmp\AI-Video-Studio-AIVS-019 / Git index] (worked)
- 2026-08-05T11:27:27Z `fix`: Approved Git index access staged explicit AIVS-019 file set without touching unrelated main-workspace changes. [C:\tmp\AI-Video-Studio-AIVS-019 / Git index]
