# #0209 Windows build script invokes global pnpm 11.10 instead of pinned Corepack pnpm 10.30.3

- 2026-07-26T17:16:34Z `issue`: Windows build script invokes global pnpm 11.10 instead of pinned Corepack pnpm 10.30.3 [scripts/local-build.ps1]
- 2026-07-26T17:18:10Z `attempt`: Changed local Windows build install and frontend-build invocations from global pnpm to Corepack-managed pnpm; verification pending. [scripts/local-build.ps1] (partial)
- 2026-07-26T17:27:16Z `attempt`: Fast Windows build completed using Corepack pnpm 10.30.3 for install and frontend build. [scripts/local-build.ps1] (worked)
- 2026-07-26T17:27:20Z `fix`: Local Windows build now resolves repository-pinned pnpm through Corepack; fast packaging passes on Node 24. [scripts/local-build.ps1]
