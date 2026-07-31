# #0442 Per-edge Reframe padding caps distort zoom/pan totals and cause placement glitches

- 2026-07-31T11:17:58Z `issue`: Per-edge Reframe padding caps distort zoom/pan totals and cause placement glitches [frontend/views/genspace/video/reframe-outpaint.ts]
- 2026-07-31T11:21:17Z `attempt`: Removed active Reframe per-edge caps; zoom now sets axis totals and pan/zoom placement derives exact opposite-side remainders [frontend/views/genspace/video/reframe-outpaint.ts] (partial)
- 2026-07-31T11:22:36Z `attempt`: Updated backend API and integration coverage to accept and forward active preset placement padding above prior 500 cap [backend/tests/test_generation.py] (partial)
- 2026-07-31T11:23:46Z `attempt`: Verified uncapped zoom/placement totals with focused geometry and API tests, full frontend/backend suites, typechecks, and production build [frontend/views/genspace/video/reframe-outpaint.ts] (worked)
- 2026-07-31T11:23:50Z `fix`: Removed active per-edge Reframe caps; zoom sets axis totals and placement redistributes exact remainders [frontend/views/genspace/video/reframe-outpaint.ts]
