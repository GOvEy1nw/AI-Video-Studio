# #0111 Primary focused backend style regression could not start because sandboxed uv was denied access to the user cache sdists-v9/.git

- 2026-08-19T11:30:40Z `issue`: Primary focused backend style regression could not start because sandboxed uv was denied access to the user cache sdists-v9/.git [backend/tests/test_generation.py]
- 2026-08-19T11:30:49Z `attempt`: Ran the three focused style pytest nodes through repository uv inside the sandbox; uv failed before collection on denied sdists-v9/.git access [backend/tests/test_generation.py] (failed)
- 2026-08-19T11:31:37Z `attempt`: Retried the exact focused style pytest nodes with normal uv cache access; all three passed [backend/tests/test_generation.py] (worked)
- 2026-08-19T11:31:37Z `fix`: Focused style regressions pass when repository uv can access the existing user cache: 3 passed [backend/tests/test_generation.py]
