# #0050 Final validation cannot read uv cache .git metadata inside managed sandbox (Access denied).

- 2026-07-20T14:01:09Z `issue`: Final validation cannot read uv cache .git metadata inside managed sandbox (Access denied). [backend/.venv]
- 2026-07-20T14:01:15Z `attempt`: Ran pyright, backend pytest, and Vite validation inside sandbox; uv failed before checks with cache access denied. [backend/.venv] (failed)
- 2026-07-20T14:06:26Z `attempt`: Elevated combined check started Pyright from repo root, so it scanned bundled WanGP; stopped exact Pyright child and will rerun from backend. [backend/pyrightconfig.json] (failed)
- 2026-07-20T14:06:56Z `attempt`: Reran from backend with uv cache access approved; Pyright reports zero errors and all 217 backend tests pass. [backend/pyrightconfig.json] (worked)
- 2026-07-20T14:07:00Z `fix`: Ran validation from backend with approved uv-cache access; Pyright and 217 backend tests pass. [backend/pyrightconfig.json]
