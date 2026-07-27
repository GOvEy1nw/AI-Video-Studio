# #0287 Phase 8 Pyright gate cannot read existing uv cache in managed sandbox

- 2026-07-27T13:33:48Z `issue`: Phase 8 Pyright gate cannot read existing uv cache in managed sandbox [backend; uv cache]
- 2026-07-27T13:33:52Z `attempt`: Ran repository TypeScript/Python gate route; uv failed on AppData cache .git access before Pyright [backend; uv cache] (failed)
- 2026-07-27T13:34:08Z `attempt`: Reran unchanged repository Pyright gate through approved uv-cache route; 0 errors and 0 warnings [backend] (worked)
- 2026-07-27T13:34:11Z `fix`: Approved uv-cache route completed Phase 8 Pyright gate cleanly [backend]
