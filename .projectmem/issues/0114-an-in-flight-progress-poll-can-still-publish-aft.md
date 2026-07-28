# #0114 An in-flight progress poll can still publish after the terminal POST response because clearing the interval does not invalidate the already-running poll.

- 2026-07-24T21:42:35Z `issue`: An in-flight progress poll can still publish after the terminal POST response because clearing the interval does not invalidate the already-running poll. [frontend/hooks/generation/useGenerationJob.ts]
- 2026-07-24T21:43:43Z `attempt`: Added a per-run pollingActive guard so an in-flight progress response cannot overwrite terminal state. [frontend/hooks/generation/useGenerationJob.ts] (worked)
- 2026-07-24T21:44:03Z `fix`: Late in-flight polling updates are ignored after terminal response; focused regression test passes. [frontend/hooks/generation/useGenerationJob.ts]
