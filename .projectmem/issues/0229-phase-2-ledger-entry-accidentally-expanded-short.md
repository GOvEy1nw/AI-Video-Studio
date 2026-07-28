# #0229 Phase 2 ledger entry accidentally expanded short rollback SHA without verifying full commit ID

- 2026-07-26T19:42:44Z `issue`: Phase 2 ledger entry accidentally expanded short rollback SHA without verifying full commit ID [docs/dependency-modernisation/STATUS.md]
- 2026-07-26T19:42:58Z `attempt`: Verified rollback commit with git rev-parse HEAD and corrected ledger to 7da576653c20a0a527c42b6ae04f5dd65c670814 [docs/dependency-modernisation/STATUS.md] (worked)
- 2026-07-26T19:43:02Z `fix`: Ledger now records exact verified pre-bump rollback SHA [docs/dependency-modernisation/STATUS.md]
