# #0321 Managed sandbox blocks Phase 10 full typecheck from reading existing uv cache

- 2026-07-27T16:29:48Z `issue`: Managed sandbox blocks Phase 10 full typecheck from reading existing uv cache [corepack pnpm typecheck; backend uv cache]
- 2026-07-27T16:29:52Z `attempt`: Ran full typecheck in sandbox; TypeScript passed but Pyright launcher failed access to uv cache sdists-v9/.git [Phase 10 full typecheck] (failed)
- 2026-07-27T16:30:11Z `attempt`: Reran unchanged full typecheck with approved uv-cache access; TypeScript and Pyright passed with zero errors/warnings [Phase 10 full typecheck] (worked)
- 2026-07-27T16:30:17Z `fix`: Approved uv-cache route completes Phase 10 full typecheck cleanly [Phase 10 full typecheck]
