# #0112 StrictMode effect replay leaves mountedRef false because setup never restores it, causing subsequent job progress/results to be ignored in development.

- 2026-07-24T21:42:08Z `issue`: StrictMode effect replay leaves mountedRef false because setup never restores it, causing subsequent job progress/results to be ignored in development. [frontend/hooks/generation/useGenerationJob.ts]
- 2026-07-24T21:43:37Z `attempt`: Restored mountedRef during every effect setup and added a StrictMode replay regression test. [frontend/hooks/generation/useGenerationJob.ts] (worked)
- 2026-07-24T21:43:56Z `fix`: StrictMode replay now restores mounted state; focused lifecycle suite passes all six tests. [frontend/hooks/generation/useGenerationJob.ts]
