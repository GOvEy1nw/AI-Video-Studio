# #0056 tracked Wan2GP checkout is entirely missing before requested pin update while the main worktree has unrelated edits

- 2026-07-21T17:19:12Z `issue`: tracked Wan2GP checkout is entirely missing before requested pin update while the main worktree has unrelated edits [Wan2GP/]
- 2026-07-21T17:19:45Z `attempt`: ensure-wan2gp clone failed inside sandbox because github.com:443 was blocked [Wan2GP/] (failed)
- 2026-07-21T17:20:38Z `attempt`: network-enabled ensure clone created the nested Git repository but stopped before checkout because the fresh no-checkout clone appeared dirty [Wan2GP/] (partial)
- 2026-07-21T17:21:30Z `attempt`: attempted to preserve the transient empty clone in C:\tmp before rerunning setup; sandbox permissions caused a partial move and did not restore Wan2GP [Wan2GP/] (failed)
- 2026-07-21T17:23:03Z `attempt`: corrected setup script reconstructed the missing Wan2GP checkout and verified the current exact pin [Wan2GP/] (worked)
- 2026-07-21T17:23:07Z `fix`: restored the tracked Wan2GP checkout at its prior pinned revision without touching unrelated worktree edits [Wan2GP/]
