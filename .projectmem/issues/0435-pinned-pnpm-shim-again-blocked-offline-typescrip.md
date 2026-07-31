# #0435 Pinned pnpm shim again blocked offline TypeScript validation on registry signature verification

- 2026-07-31T10:59:37Z `issue`: Pinned pnpm shim again blocked offline TypeScript validation on registry signature verification [frontend validation tooling]
- 2026-07-31T10:59:43Z `attempt`: Ran repository pnpm typecheck:ts; package-manager shim could not verify registry signatures offline [frontend validation tooling] (failed)
- 2026-07-31T11:00:22Z `attempt`: Ran typecheck:ts through cached pinned pnpm 10.30.3; command completed [frontend validation tooling] (worked)
- 2026-07-31T11:00:27Z `fix`: Cached pinned pnpm bypasses offline shim signature verification; strict TypeScript passes [frontend validation tooling]
