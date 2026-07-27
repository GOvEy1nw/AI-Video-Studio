# #0204 Phase 1 fast Windows build blocked because nested Wan2GP checkout has local source changes

- 2026-07-26T17:02:21Z `issue`: Phase 1 fast Windows build blocked because nested Wan2GP checkout has local source changes [Wan2GP]
- 2026-07-26T17:02:31Z `attempt`: Tried nested Git status in sandbox; Git rejected Wan2GP as dubious ownership before showing changes [Wan2GP] (failed)
- 2026-07-26T17:02:58Z `attempt`: Elevated inspection found 19 tracked changes/deletions and export_wan2gp_model_metadata.py untracked at pinned SHA; no files touched [Wan2GP] (partial)
- 2026-07-26T17:12:15Z `attempt`: Backed up dirty nested changes, reset Wan2GP to requested SHA, removed backed-up untracked tool, and verified clean checkout [Wan2GP] (worked)
- 2026-07-26T17:12:19Z `fix`: Phase 1 packaging blocker cleared: clean Wan2GP checkout pinned to 4f441a12f3a33f4466ed422428bf667d9651bc55 [Wan2GP]
