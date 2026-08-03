# #0473 Documented cached pnpm 10.30.3 path no longer exists, blocking production build command

- 2026-08-02T11:32:07Z `issue`: Documented cached pnpm 10.30.3 path no longer exists, blocking production build command [frontend validation tooling]
- 2026-08-02T11:32:13Z `attempt`: Tried prior LocalAppData pnpm 10.30.3 pnpm.cjs path; Node reported MODULE_NOT_FOUND. [frontend validation tooling] (failed)
- 2026-08-02T11:32:39Z `attempt`: Used installed Roaming npm pnpm.mjs directly; complete renderer, Electron main, and preload production build passed. [frontend validation tooling] (worked)
- 2026-08-02T11:32:43Z `fix`: Production build restored via C:/Users/rais/AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.mjs; renderer, Electron main, and preload bundles pass. [frontend validation tooling]
