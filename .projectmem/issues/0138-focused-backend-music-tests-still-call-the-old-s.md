# #0138 Focused backend Music tests still call the old single audio resolver shape and expect empty Custom lyrics to be rejected.

- 2026-07-25T17:14:16Z `issue`: Focused backend Music tests still call the old single audio resolver shape and expect empty Custom lyrics to be rejected. [backend/tests/]
- 2026-07-25T17:15:21Z `attempt`: Migrated backend Music tests to list-based A/B/AB routing and added hidden Auto/Custom composition seed/Think coverage. [backend/tests/] (partial)
- 2026-07-25T17:15:39Z `attempt`: Focused backend Music suite passes all 39 tests with A/B/AB routing and both lyric-composition paths covered. [backend/tests/] (worked)
- 2026-07-25T17:15:42Z `fix`: Backend Music tests now match the canonical two-input contract and generation-time lyric fallback behavior. [backend/tests/]
