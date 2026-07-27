# #0281 Phase 8 effective-config capture cannot write planned temporary files under C:\tmp in managed sandbox

- 2026-07-27T13:18:47Z `issue`: Phase 8 effective-config capture cannot write planned temporary files under C:\tmp in managed sandbox [C:\tmp; TypeScript baseline]
- 2026-07-27T13:18:51Z `attempt`: Piped TypeScript 5.9 effective configs to C:\tmp; Set-Content was denied for both temporary files [C:\tmp] (failed)
- 2026-07-27T13:19:06Z `attempt`: Captured both TypeScript 5.9 effective configs as temporary workspace files for later comparison and deletion [.tmp-tsconfig-frontend-before.json; .tmp-tsconfig-node-before.json] (worked)
- 2026-07-27T13:19:09Z `fix`: Used disposable workspace-local effective-config files after C:\tmp write denial [.tmp-tsconfig-frontend-before.json; .tmp-tsconfig-node-before.json]
