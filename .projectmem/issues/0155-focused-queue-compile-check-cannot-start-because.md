# #0155 Focused queue compile check cannot start because backend virtualenv Python launcher points to an unavailable uv runtime executable.

- 2026-08-20T21:15:09Z `issue`: Focused queue compile check cannot start because backend virtualenv Python launcher points to an unavailable uv runtime executable. [backend/.venv]
- 2026-08-20T21:15:14Z `attempt`: Ran backend .venv compileall for changed queue modules; launcher could not create its configured uv Python runtime. [backend/.venv] (failed)
- 2026-08-20T21:16:31Z `attempt`: Ran focused queue pytest through uv offline; uv was denied access to its sdists-v9 .git cache before collection. [backend/tests/test_generation_queue.py] (failed)
- 2026-08-20T21:16:55Z `attempt`: Escalated focused pytest reached the environment but used a repository-relative test path from backend cwd; pytest reported file not found. [backend/tests/test_generation_queue.py] (failed)
- 2026-08-20T21:23:21Z `fix`: Focused queue tests run successfully through the approved uv cache access path; backend virtualenv launcher issue is bypassed by uv. [backend/tests/test_generation_queue.py]
