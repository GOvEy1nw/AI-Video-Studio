# #0308 Phase 9 ledger patch inserted an unverified expanded c285bbb SHA instead of reading the canonical full commit ID

- 2026-07-27T15:29:23Z `issue`: Phase 9 ledger patch inserted an unverified expanded c285bbb SHA instead of reading the canonical full commit ID [docs/dependency-modernisation/STATUS.md]
- 2026-07-27T15:29:43Z `attempt`: Read c285bbb through git rev-parse and replaced both ledger references with canonical c285bbbbc966b41f1931be1b40f42b0f34e3af4f [docs/dependency-modernisation/STATUS.md] (worked)
- 2026-07-27T15:29:47Z `fix`: Phase 9 status now records the canonical full implementation SHA obtained from Git [docs/dependency-modernisation/STATUS.md]
