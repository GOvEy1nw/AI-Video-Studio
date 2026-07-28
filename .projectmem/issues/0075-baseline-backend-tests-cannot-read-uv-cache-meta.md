# #0075 Baseline backend tests cannot read uv cache metadata inside the managed sandbox.

- 2026-07-23T14:41:30Z `issue`: Baseline backend tests cannot read uv cache metadata inside the managed sandbox. [backend/.venv]
- 2026-07-23T14:41:42Z `attempt`: Ran baseline backend pytest inside the managed sandbox; uv failed on cache metadata access before tests started. [backend/.venv] (failed)
- 2026-07-23T14:42:45Z `attempt`: Reran baseline backend pytest with approved uv-cache access; 239 tests passed and 1 skipped. [backend/.venv] (worked)
- 2026-07-23T14:42:49Z `fix`: Baseline backend validation succeeds with approved access to the existing uv cache: 239 passed, 1 skipped. [backend/.venv]
