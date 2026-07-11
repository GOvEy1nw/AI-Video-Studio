# #0019 Runtime could choose an API-only fallback despite the WanGP-only local product boundary.

- 2026-07-10T15:07:26Z `issue`: Runtime could choose an API-only fallback despite the WanGP-only local product boundary. [backend/runtime_config/runtime_policy.py]
- 2026-07-10T15:07:26Z `attempt`: Removed forced API runtime route, handler, config field, decision helper, startup branch, and coverage. Search is clean; pyright and focused backend tests pass. (worked)
- 2026-07-10T15:44:45Z `fix`: Forced cloud API runtime policy and its routes were removed; generation requires WanGP. [backend/runtime_config/runtime_policy.py]
