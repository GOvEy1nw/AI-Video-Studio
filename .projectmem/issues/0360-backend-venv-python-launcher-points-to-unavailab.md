# #0360 backend .venv Python launcher points to unavailable uv-managed cpython-3.11.9 path, so direct focused pytest cannot start.

- 2026-07-28T15:04:38Z `issue`: backend .venv Python launcher points to unavailable uv-managed cpython-3.11.9 path, so direct focused pytest cannot start. [focused backend validation]
- 2026-07-28T15:04:46Z `attempt`: Direct backend .venv pytest invocation failed before collection because venv launcher targets missing uv Python executable. [focused backend validation] (failed)
- 2026-07-28T15:05:41Z `attempt`: Ran focused pytest through repository uv project with approved cache access; 9 tests passed. [focused backend validation] (worked)
- 2026-07-28T15:05:44Z `fix`: Bypassed stale venv launcher via uv run --project backend; focused model-pack pytest passes 9/9. [focused backend validation]
