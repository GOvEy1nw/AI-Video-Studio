# #0300 Phase 9 installer build completes artifacts but CI mode triggers unintended GitHub publish and fails without GH_TOKEN

- 2026-07-27T14:45:55Z `issue`: Phase 9 installer build completes artifacts but CI mode triggers unintended GitHub publish and fails without GH_TOKEN [scripts/local-build.ps1; electron-builder.yml; package.json]
- 2026-07-27T14:46:01Z `attempt`: Ran full installer build with CI=true for non-interactive pnpm; NSIS artifacts built, then Electron Builder implicitly published and failed for missing GH_TOKEN [scripts/local-build.ps1; electron-builder.yml; package.json] (failed)
- 2026-07-27T14:46:30Z `attempt`: Retried through pnpm script with -- -Publish never; pnpm forwarded a literal -- and PowerShell rejected it as an ambiguous parameter [scripts/local-build.ps1; package.json] (failed)
- 2026-07-27T14:48:31Z `attempt`: Ran repository installer script directly with -Publish never and no CI environment; full NSIS build completed locally without upload attempt [scripts/local-build.ps1; electron-builder.yml; package.json] (worked)
- 2026-07-27T14:48:35Z `fix`: Explicit local Publish=never route produced AiVS-Setup.exe without requiring GH_TOKEN or changing build scripts [scripts/local-build.ps1; electron-builder.yml; package.json]
