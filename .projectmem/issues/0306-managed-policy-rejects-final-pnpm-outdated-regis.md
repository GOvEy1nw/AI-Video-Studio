# #0306 Managed policy rejects final pnpm outdated registry query because direct dependency metadata disclosure lacks package-specific user approval

- 2026-07-27T15:11:03Z `issue`: Managed policy rejects final pnpm outdated registry query because direct dependency metadata disclosure lacks package-specific user approval [Phase 9 pnpm outdated final graph gate]
- 2026-07-27T15:22:03Z `attempt`: User explicitly approved direct dependency metadata disclosure; pnpm outdated completed and reported only @types/node 26, react-dropzone 19, and TypeScript 7 as intentionally out-of-scope majors [Phase 9 pnpm outdated final graph gate] (worked)
- 2026-07-27T15:22:11Z `fix`: Explicit user approval enabled final registry freshness query; remaining majors are documented deferrals, not unnoticed updates [Phase 9 pnpm outdated final graph gate]
