# #0292 Phase 9 pnpm audit cannot reach npm advisory endpoint in managed sandbox

- 2026-07-27T13:51:16Z `issue`: Phase 9 pnpm audit cannot reach npm advisory endpoint in managed sandbox [package.json; pnpm audit]
- 2026-07-27T13:51:20Z `attempt`: Ran production pnpm audit in managed sandbox; advisory POST failed EACCES and entered retry backoff [package.json; pnpm audit] (failed)
- 2026-07-27T14:19:35Z `attempt`: Reran both audits after explicit maintainer approval; npm advisory endpoint returned production and full dependency findings [package.json; pnpm audit] (worked)
- 2026-07-27T14:19:39Z `fix`: Explicit maintainer consent enabled required npm production and full audit gates [package.json; pnpm audit]
