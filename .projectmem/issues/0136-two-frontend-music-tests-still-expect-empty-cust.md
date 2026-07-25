# #0136 Two frontend Music tests still expect empty Custom lyrics rejection and hidden Auto lyrics controls after behavior changed.

- 2026-07-25T17:10:39Z `issue`: Two frontend Music tests still expect empty Custom lyrics rejection and hidden Auto lyrics controls after behavior changed. [frontend/views/genspace/]
- 2026-07-25T17:12:32Z `attempt`: Updated Music controls and focused tests for always-visible disabled lyrics fields, empty-Custom fallback, and dual audio mapping. [frontend/views/genspace/] (partial)
- 2026-07-25T17:12:47Z `attempt`: Focused frontend rerun passed lyrics behavior but the new dual-input test expected Windows separators and omitted explicit undefined optional fields. [frontend/views/genspace/logic/generation-requests.test.ts] (failed)
- 2026-07-25T17:13:00Z `attempt`: Adjusted the dual-input assertion to the canonical file URL conversion and optional request fields. [frontend/views/genspace/logic/generation-requests.test.ts] (partial)
- 2026-07-25T17:13:16Z `attempt`: Focused Music frontend suite now passes all 22 tests, including disabled lyrics fields and dual audio request mapping. [frontend/views/genspace/] (worked)
- 2026-07-25T17:13:22Z `fix`: Music settings and request tests now match the requested always-visible lyrics controls and generation-time fallback behavior. [frontend/views/genspace/]
