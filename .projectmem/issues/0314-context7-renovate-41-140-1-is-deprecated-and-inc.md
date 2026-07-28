# #0314 Context7 Renovate 41.140.1 is deprecated and incompatible with project Node 24 for local dry-run

- 2026-07-27T16:05:12Z `issue`: Context7 Renovate 41.140.1 is deprecated and incompatible with project Node 24 for local dry-run [Phase 10 Renovate validator/dry-run version selection]
- 2026-07-27T16:06:35Z `attempt`: Queried npm registry; current Renovate 43.284.1 supports Node ^24.11.0, unlike deprecated Context7 version 41.140.1 [Phase 10 Renovate validator/dry-run version selection] (partial)
- 2026-07-27T16:07:50Z `attempt`: Tried current Renovate 43.284.1 validator; repository minimumReleaseAge rejected the 65-minute-old release before execution [Phase 10 Renovate validator/dry-run version selection] (failed)
- 2026-07-27T16:11:03Z `attempt`: Selected Renovate 43.272.4, newest 43.x release older than seven days with Node 24 support; official validator passed [renovate.json] (worked)
- 2026-07-27T16:11:08Z `fix`: Phase 10 validation uses mature Node-24-compatible Renovate 43.272.4 instead of deprecated Context7 41.x build [renovate.json]
