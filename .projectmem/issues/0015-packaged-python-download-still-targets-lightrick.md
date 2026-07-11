# #0015 Packaged Python download still targets Lightricks assets and extracts unverified runtime parts; release GPU setup diverges from tested WanGP stack.

- 2026-07-10T14:42:50Z `issue`: Packaged Python download still targets Lightricks assets and extracts unverified runtime parts; release GPU setup diverges from tested WanGP stack. [electron/python-setup.ts; scripts/prepare-python.ps1]
- 2026-07-10T14:43:39Z `attempt`: Initial deterministic-runtime patch did not apply because its source-context regex did not exactly match electron/python-setup.ts; no files changed. (failed)
- 2026-07-10T14:46:02Z `attempt`: Deterministic-runtime patch passes TypeScript typecheck and PowerShell parser validation; Bash syntax check could not run because this Windows host has no WSL distribution. (partial)
- 2026-07-10T14:48:12Z `attempt`: Runtime downloader, release asset generator, WanGP pin, shared GPU stack, and publisher metadata patch pass TypeScript typecheck, PowerShell parser checks, and git diff validation. (worked)
- 2026-07-10T18:58:56Z `fix`: Removed packaged Lightricks runtime download path; bundled Python+pip+uv now installs the pinned WanGP stack on first run. [electron/python-setup.ts]
