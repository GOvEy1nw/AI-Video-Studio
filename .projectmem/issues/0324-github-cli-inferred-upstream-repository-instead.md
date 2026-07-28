# #0324 GitHub CLI inferred upstream repository instead of origin fork for frontend workflow dispatch

- 2026-07-27T16:44:50Z `issue`: GitHub CLI inferred upstream repository instead of origin fork for frontend workflow dispatch [Phase 10 GitHub workflow dispatch]
- 2026-07-27T16:44:54Z `attempt`: Dispatched by workflow filename without --repo; gh queried deepbeepmeep/LTX-Desktop-WanGP and returned HTTP 404 [Phase 10 GitHub workflow dispatch] (failed)
- 2026-07-27T16:45:05Z `attempt`: Retried with explicit origin repo; gh reached GOvEy1nw/AI-Video-Studio but GitHub cannot dispatch workflow absent from default branch [Phase 10 GitHub workflow dispatch] (partial)
- 2026-07-27T16:45:09Z `fix`: Explicit --repo targets origin correctly; remaining 404 is expected because GitHub only dispatches workflows present on default branch [Phase 10 GitHub workflow dispatch]
