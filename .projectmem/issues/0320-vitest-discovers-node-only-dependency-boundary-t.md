# #0320 Vitest discovers Node-only dependency-boundary test and transforms import.meta.url into non-file URL

- 2026-07-27T16:28:13Z `issue`: Vitest discovers Node-only dependency-boundary test and transforms import.meta.url into non-file URL [scripts/check-dependency-boundaries.test.mjs; frontend Vitest suite]
- 2026-07-27T16:28:31Z `attempt`: Ran full frontend suite; Vitest included scripts/check-dependency-boundaries.test.mjs and failed Node fileURLToPath under transformed URL [frontend Vitest suite] (failed)
- 2026-07-27T16:28:59Z `attempt`: Renamed Node test away from Vitest *.test discovery while keeping explicit node --test package script [scripts/check-dependency-boundaries.node-test.mjs] (partial)
- 2026-07-27T16:29:27Z `attempt`: Reran explicit Node tests and validate:frontend; Node suite passed 5/5 and Vitest returned to 22 files/75 tests before successful build [scripts/check-dependency-boundaries.node-test.mjs] (worked)
- 2026-07-27T16:29:31Z `fix`: Node boundary tests use .node-test.mjs and no longer enter frontend Vitest discovery [scripts/check-dependency-boundaries.node-test.mjs]
