# #0175 The global queue provider polls every second instead of the plan's adaptive 500 ms, 2 s, and 5 s cadence.

- 2026-08-20T22:54:47Z `issue`: The global queue provider polls every second instead of the plan's adaptive 500 ms, 2 s, and 5 s cadence. [frontend/contexts/GenerationQueueContext.tsx]
- 2026-08-20T22:55:12Z `attempt`: Replaced the fixed interval with one recursive poller using 500 ms active/queued, 2 s attention, and 5 s idle/error delays; validation pending. [frontend/contexts/GenerationQueueContext.tsx] (partial)
- 2026-08-20T22:56:53Z `attempt`: Aligned the queue context refresh contract with the snapshot returned by adaptive polling after TypeScript identified the old Promise<void> signature; typecheck rerun pending. [frontend/contexts/GenerationQueueContext.tsx] (partial)
- 2026-08-20T22:57:26Z `attempt`: TypeScript passed with the single adaptive poller and its snapshot-returning refresh contract. [frontend/contexts/GenerationQueueContext.tsx] (worked)
- 2026-08-20T22:57:31Z `fix`: Confirmed one adaptive poll loop at 500 ms active, 2 s attention, and 5 s idle/error; TypeScript and focused queue frontend tests pass. [frontend/contexts/GenerationQueueContext.tsx]
