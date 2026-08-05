# #0651 AIVS-026 benchmark stdout uses Node process global not included in renderer test TypeScript types.

- 2026-08-05T18:00:03Z `issue`: AIVS-026 benchmark stdout uses Node process global not included in renderer test TypeScript types. [frontend/views/editor/playback-index.test.ts]
- 2026-08-05T18:00:26Z `attempt`: Added local narrow Node stdout declaration for benchmark-only test output. [frontend/views/editor/playback-index.test.ts] (partial)
- 2026-08-05T18:00:40Z `fix`: Benchmark test retains visible stdout and strict TypeScript compatibility; index benchmark and typecheck pass. [frontend/views/editor/playback-index.test.ts]
