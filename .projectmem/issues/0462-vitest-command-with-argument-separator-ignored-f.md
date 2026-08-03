# #0462 Vitest command with argument separator ignored file filters and ran full suite, exposing five unrelated baseline failures

- 2026-08-02T09:16:48Z `issue`: Vitest command with argument separator ignored file filters and ran full suite, exposing five unrelated baseline failures [frontend test invocation]
- 2026-08-02T09:17:04Z `attempt`: Removed separator so pnpm forwards six test paths directly to Vitest [frontend test invocation] (worked)
- 2026-08-02T09:17:08Z `fix`: Focused invocation now runs exactly six suites; 37 tests pass [frontend test invocation]
