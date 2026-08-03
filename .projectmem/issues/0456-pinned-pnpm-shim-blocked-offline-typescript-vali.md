# #0456 Pinned pnpm shim blocked offline TypeScript validation on registry signature verification

- 2026-08-02T09:07:57Z `issue`: Pinned pnpm shim blocked offline TypeScript validation on registry signature verification [frontend validation tooling]
- 2026-08-02T09:08:01Z `attempt`: Ran repository pnpm typecheck:ts; package-manager shim could not verify registry signatures offline [frontend validation tooling] (failed)
- 2026-08-02T09:10:07Z `attempt`: Ran typecheck:ts through cached pnpm 10.30.3 store entry; strict TypeScript completed successfully [frontend validation tooling] (worked)
- 2026-08-02T09:10:11Z `fix`: Cached pinned pnpm bypasses offline shim signature verification for repository scripts [frontend validation tooling]
