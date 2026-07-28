# #0274 Phase 7 npm registry target-version query hangs in managed sandbox

- 2026-07-27T12:46:21Z `issue`: Phase 7 npm registry target-version query hangs in managed sandbox [docs/dependency-modernisation/07_REACT_19_MIGRATION.md]
- 2026-07-27T12:46:29Z `attempt`: Queried four exact React 19.2 package families with npm view; only config warning returned before 30-second timeout [docs/dependency-modernisation/07_REACT_19_MIGRATION.md] (failed)
- 2026-07-27T12:47:14Z `attempt`: Reran exact React package-family registry queries through approved network route [docs/dependency-modernisation/07_REACT_19_MIGRATION.md] (worked)
- 2026-07-27T12:47:22Z `fix`: Approved registry route confirmed React/React DOM 19.2.8 and compatible current React 19 type patches [docs/dependency-modernisation/07_REACT_19_MIGRATION.md]
