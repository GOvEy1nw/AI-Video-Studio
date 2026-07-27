# #0265 Phase 5 final Pyright gate cannot read uv cache .git under managed sandbox

- 2026-07-27T11:40:35Z `issue`: Phase 5 final Pyright gate cannot read uv cache .git under managed sandbox [backend/typecheck:py; C:\Users\rais\AppData\Local\uv\cache]
- 2026-07-27T11:40:40Z `attempt`: Ran repository typecheck:py command in managed sandbox; uv failed before Pyright because cache sdists-v9/.git was unreadable [backend/typecheck:py] (failed)
- 2026-07-27T11:40:53Z `attempt`: Reran typecheck:py through approved route with uv cache access; Pyright completed with zero errors and warnings [backend/typecheck:py] (worked)
- 2026-07-27T11:40:57Z `fix`: Approved validation route restored uv cache access; final Pyright gate passes cleanly [backend/typecheck:py]
