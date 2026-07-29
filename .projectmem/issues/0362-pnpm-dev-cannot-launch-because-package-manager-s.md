# #0362 pnpm dev cannot launch because package-manager shim cannot verify pnpm@10.30.3 registry signature while registry fetches fail

- 2026-07-28T15:14:28Z `issue`: pnpm dev cannot launch because package-manager shim cannot verify pnpm@10.30.3 registry signature while registry fetches fail [development tooling / pnpm dev]
- 2026-07-28T15:14:31Z `attempt`: Tried launching Electron with pnpm dev; package-manager shim rejected launch after registry fetch/signature verification failed [development tooling / pnpm dev] (failed)
- 2026-07-28T15:14:51Z `attempt`: Tried bundled fallback pnpm; it is 11.9.0 and repository engine requires exactly 10.30.3 [development tooling / bundled fallback pnpm] (failed)
- 2026-07-28T15:17:31Z `attempt`: Directly invoking cached pnpm 10.30.3 bypassed registry verification and started Vite builds; Electron remained blocked by Windows profile lock/access error [development tooling / cached Corepack pnpm 10.30.3] (partial)
- 2026-07-28T15:18:27Z `fix`: Bypassed failing global shim with cached Corepack pnpm 10.30.3; repository dev script reached Vite and completed renderer/Electron development builds. [development tooling / cached Corepack pnpm 10.30.3]
