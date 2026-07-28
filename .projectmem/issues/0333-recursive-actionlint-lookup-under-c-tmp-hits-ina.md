# #0333 Recursive actionlint lookup under C:\tmp hits inaccessible wangp-hf-runtime paths and returns nonzero despite finding cached binary

- 2026-07-28T08:05:24Z `issue`: Recursive actionlint lookup under C:\tmp hits inaccessible wangp-hf-runtime paths and returns nonzero despite finding cached binary [Phase 11 CI workflow cleanup validation]
- 2026-07-28T08:05:34Z `attempt`: Used known cached actionlint executable directly, avoiding inaccessible unrelated C:\tmp runtime tree [Phase 11 CI workflow cleanup validation] (worked)
- 2026-07-28T08:05:39Z `fix`: Both GitHub Actions workflows pass actionlint using cached Phase 10 binary [Phase 11 CI workflow cleanup validation]
