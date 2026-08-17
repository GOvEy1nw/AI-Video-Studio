# #0091 AIVS-015 upscale catalog fetch failure is swallowed, leaving a permanent Loading state with no retry

- 2026-08-16T19:40:52Z `issue`: AIVS-015 upscale catalog fetch failure is swallowed, leaving a permanent Loading state with no retry [frontend/views/genspace/hooks/useGenSpaceUpscaleState.ts]
- 2026-08-16T19:43:16Z `attempt`: Added retryable catalog state to the hook; the multi-file patch stopped before wiring controller and panel props [frontend/views/genspace/hooks/useGenSpaceUpscaleState.ts] (partial)
- 2026-08-16T19:43:54Z `attempt`: Wired catalog error/loading/retry through both mode controllers and panel, with a failed-fetch then retry-success hook test [frontend/views/genspace/hooks/useGenSpaceUpscaleState.ts] (worked)
- 2026-08-16T19:45:00Z `fix`: Upscale catalog failures now render an alert with Retry; failed-fetch then retry-success test, TS typecheck, and frontend build pass [frontend/views/genspace/hooks/useGenSpaceUpscaleState.ts]
