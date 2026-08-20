# #0142 pnpm test:frontend -- frontend/lib/theme.test.ts runs the full suite and exposes 12 unrelated existing GenSpace and model-profile failures.

- 2026-08-20T17:58:17Z `issue`: pnpm test:frontend -- frontend/lib/theme.test.ts runs the full suite and exposes 12 unrelated existing GenSpace and model-profile failures. [frontend/lib/theme.test.ts]
- 2026-08-20T17:58:30Z `attempt`: Ran the focused theme utility directly through Vitest; 3 tests passed and confirmed the pnpm wrapper was the cause of broad execution. [frontend/lib/theme.test.ts] (worked)
- 2026-08-20T17:58:30Z `fix`: Focused theme validation is reliable via pnpm exec vitest run frontend/lib/theme.test.ts; broader failures are unrelated. [frontend/lib/theme.test.ts]
