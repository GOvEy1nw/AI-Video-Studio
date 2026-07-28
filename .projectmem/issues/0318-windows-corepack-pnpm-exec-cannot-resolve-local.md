# #0318 Windows Corepack pnpm exec cannot resolve local Electron binary after frozen reinstall

- 2026-07-27T16:26:53Z `issue`: Windows Corepack pnpm exec cannot resolve local Electron binary after frozen reinstall [Phase 10 workflow Electron verification; .github/workflows/frontend-toolchain.yml]
- 2026-07-27T16:26:56Z `attempt`: Ran required corepack pnpm exec electron --version; Windows runner reported electron not recognized despite installed package [Phase 10 workflow Electron verification] (failed)
- 2026-07-27T16:27:17Z `attempt`: Switched Windows CI verification to generated electron.CMD shim; local check downloaded missing binary and reported v43.2.0 [.github/workflows/frontend-toolchain.yml] (worked)
- 2026-07-27T16:27:20Z `fix`: Windows workflow verifies Electron 43.2.0 through deterministic generated CMD shim [.github/workflows/frontend-toolchain.yml]
