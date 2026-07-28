# #0253 Phase 3 requires pnpm dev:debug but package.json has no dev:debug script

- 2026-07-27T10:14:28Z `issue`: Phase 3 requires pnpm dev:debug but package.json has no dev:debug script [package.json]
- 2026-07-27T10:15:15Z `attempt`: Ran corepack pnpm dev:debug and confirmed existing script sets BACKEND_DEBUG=1 and ELECTRON_DEBUG=1; earlier package read was misinterpreted [package.json] (worked)
- 2026-07-27T10:15:18Z `fix`: Confirmed Phase 3 debug script already exists; no package script change required [package.json]
