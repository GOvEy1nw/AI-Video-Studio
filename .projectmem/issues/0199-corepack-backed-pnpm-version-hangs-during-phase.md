# #0199 Corepack-backed pnpm --version hangs during Phase 1 toolchain inventory

- 2026-07-26T16:47:28Z `issue`: Corepack-backed pnpm --version hangs during Phase 1 toolchain inventory [packageManager/pnpm]
- 2026-07-26T16:47:42Z `attempt`: Tried to inspect hanging pnpm process through CIM; managed sandbox denied process enumeration [packageManager/pnpm] (failed)
- 2026-07-26T16:47:57Z `attempt`: Broad pnpm command-line filter matched the cleanup PowerShell itself; command terminated before reporting target details [packageManager/pnpm] (failed)
- 2026-07-26T16:50:56Z `attempt`: Corepack downloaded pnpm 10.30.3 and runs it explicitly; global shim enable failed with EPERM under Program Files [packageManager/pnpm] (partial)
- 2026-07-26T16:52:26Z `attempt`: Verified explicit Corepack route runs cached pnpm 10.30.3 under Node 24.18.0 [packageManager/pnpm] (worked)
- 2026-07-26T16:52:29Z `fix`: Phase commands can use corepack pnpm at exact 10.30.3; global shim EPERM remains a host limitation [packageManager/pnpm]
