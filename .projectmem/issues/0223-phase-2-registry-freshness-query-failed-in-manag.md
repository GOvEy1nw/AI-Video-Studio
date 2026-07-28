# #0223 Phase 2 registry freshness query failed in managed sandbox with npm EACCES

- 2026-07-26T19:31:07Z `issue`: Phase 2 registry freshness query failed in managed sandbox with npm EACCES [docs/dependency-modernisation/02_ELECTRON_43_MIGRATION.md]
- 2026-07-26T19:31:57Z `attempt`: Queried npm registry for Electron 43 and @types/node 24 in sandbox; both requests failed with EACCES [docs/dependency-modernisation/02_ELECTRON_43_MIGRATION.md] (failed)
- 2026-07-26T19:32:27Z `attempt`: Reran registry freshness query through approved network route; Electron 43.2.0 and @types/node 24.13.3 confirmed [docs/dependency-modernisation/02_ELECTRON_43_MIGRATION.md] (worked)
- 2026-07-26T19:32:31Z `fix`: Approved network route completed registry freshness check and confirmed exact target versions [docs/dependency-modernisation/02_ELECTRON_43_MIGRATION.md]
