# #0028 Backend pytest exits with status 1 but emits no diagnostics when invoked through uv; test failure cause needs capture.

- 2026-07-10T16:15:41Z `issue`: Backend pytest exits with status 1 but emits no diagnostics when invoked through uv; test failure cause needs capture. [backend/tests]
- 2026-07-10T16:16:03Z `attempt`: Captured failure: tests/fakes/services.py imports deleted services.ltx_api_client.ltx_api_client.LTXRetakeResult. [backend/tests/fakes/services.py] (failed)
- 2026-07-10T16:16:45Z `attempt`: Removed fake test dependency on deleted LTX API package by defining the minimal local FakeRetakeResult shape; pytest rerun pending. [backend/tests/fakes/services.py] (partial)
- 2026-07-10T16:19:14Z `attempt`: Removed stale cloud-credential and direct-pipeline expectations; generation state tests now cover WanGP jobs and settings tests no longer assert removed text cache. [backend/tests/test_state_actions.py] (partial)
- 2026-07-10T16:19:32Z `attempt`: WanGP job completion keeps generation progress at complete, so the migrated test's idle expectation was incorrect. [backend/tests/test_state_actions.py] (failed)
- 2026-07-10T16:19:46Z `attempt`: Changed migrated generation progress test to assert the actual complete terminal state; final backend test rerun pending. [backend/tests/test_state_actions.py] (partial)
- 2026-07-10T16:20:05Z `fix`: Removed deleted cloud/direct-pipeline test dependencies and aligned remaining state tests to WanGP terminal behavior; 186 backend tests pass. [backend/tests]
