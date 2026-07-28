# #0288 Phase 8 backend suite cannot sync through existing uv cache in managed sandbox

- 2026-07-27T13:34:21Z `issue`: Phase 8 backend suite cannot sync through existing uv cache in managed sandbox [backend; uv cache]
- 2026-07-27T13:34:29Z `attempt`: Ran repository backend test gate; uv sync failed on AppData cache .git access before pytest [backend; uv cache] (failed)
- 2026-07-27T13:34:54Z `attempt`: Reran unchanged backend gate through approved uv-cache route; 278 passed and 1 skipped [backend] (worked)
- 2026-07-27T13:34:58Z `fix`: Approved uv-cache route completed Phase 8 backend regression suite [backend]
