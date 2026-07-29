# #0356 Frontend test command with literal -- reruns stale pre-edit ModelPackManager transform and ignores focused filter

- 2026-07-28T14:36:37Z `issue`: Frontend test command with literal -- reruns stale pre-edit ModelPackManager transform and ignores focused filter [frontend/components/ModelPackManager.test.tsx]
- 2026-07-28T14:37:03Z `attempt`: Removed literal -- so Vitest focused only ModelPackManager test; rendered cards were current ungrouped branch because fixture omitted required groupId metadata. [frontend/components/ModelPackManager.test.tsx] (partial)
- 2026-07-28T14:37:39Z `attempt`: Focused command without literal -- plus matching groupId fixture reaches grouped-card assertions; no stale transform or unrelated suites. [frontend/components/ModelPackManager.test.tsx] (worked)
- 2026-07-28T14:37:43Z `fix`: Focused frontend test invocation omits literal -- and uses metadata-complete fixture, eliminating unrelated suites and false stale-render diagnosis. [frontend/components/ModelPackManager.test.tsx]
