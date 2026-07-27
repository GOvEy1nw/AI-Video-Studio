# #0298 Managed sandbox blocks Phase 9 git staging by denying .git/index.lock creation

- 2026-07-27T14:23:30Z `issue`: Managed sandbox blocks Phase 9 git staging by denying .git/index.lock creation [.git/index; package.json; pnpm-lock.yaml]
- 2026-07-27T14:23:33Z `attempt`: Staged reviewed Group A package/lock changes in managed sandbox; git could not create .git/index.lock [.git/index; package.json; pnpm-lock.yaml] (failed)
- 2026-07-27T14:23:45Z `attempt`: Retried exact git add with approved repository metadata access; only package.json and pnpm-lock.yaml staged [.git/index; package.json; pnpm-lock.yaml] (worked)
- 2026-07-27T14:23:48Z `fix`: Approved git metadata access enabled scoped Phase 9 staging [.git/index; package.json; pnpm-lock.yaml]
