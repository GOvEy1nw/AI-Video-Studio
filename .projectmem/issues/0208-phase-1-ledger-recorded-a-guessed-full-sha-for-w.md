# #0208 Phase 1 ledger recorded a guessed full SHA for WanGP pin commit instead of verified rev-parse output

- 2026-07-26T17:15:45Z `issue`: Phase 1 ledger recorded a guessed full SHA for WanGP pin commit instead of verified rev-parse output [docs/dependency-modernisation/STATUS.md]
- 2026-07-26T17:15:59Z `attempt`: Replaced all guessed commit IDs with verified git rev-parse SHA 8db86258502c4fca1bb3b69b429b862ae343ede3 [docs/dependency-modernisation/STATUS.md] (worked)
- 2026-07-26T17:16:02Z `fix`: Phase 1 ledger now uses verified WanGP pin commit SHA [docs/dependency-modernisation/STATUS.md]
