# #0212 Electron-builder pnpm node-module collector invokes global pnpm 11.10.0 and fails strict packageManager 10.30.3 check.

- 2026-07-26T17:25:30Z `issue`: Electron-builder pnpm node-module collector invokes global pnpm 11.10.0 and fails strict packageManager 10.30.3 check. [scripts/create-installer.ps1 / electron-builder 26.15.3]
- 2026-07-26T17:26:37Z `attempt`: Clear inherited COREPACK_ROOT before electron-builder so its PATH-discovered pnpm can honor packageManager 10.30.3; packaging verification pending. [scripts/create-installer.ps1] (partial)
- 2026-07-26T17:27:08Z `attempt`: Fast Windows packaging completed; electron-builder collector selected pnpm 10.30.3 after COREPACK_ROOT cleanup. [scripts/create-installer.ps1] (worked)
- 2026-07-26T17:27:11Z `fix`: Removed outer Corepack marker at electron-builder boundary so direct pnpm honors repository packageManager 10.30.3. [scripts/create-installer.ps1]
