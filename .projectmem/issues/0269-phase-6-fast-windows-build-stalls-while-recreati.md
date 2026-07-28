# #0269 Phase 6 fast Windows build stalls while recreating node_modules in network-restricted sandbox

- 2026-07-27T12:12:00Z `issue`: Phase 6 fast Windows build stalls while recreating node_modules in network-restricted sandbox [node_modules; scripts/local-build.ps1]
- 2026-07-27T12:12:04Z `attempt`: Ran CI=true fast Windows build in managed sandbox; build entered pnpm node_modules recreation then produced no output for 60 seconds [node_modules; scripts/local-build.ps1] (partial)
- 2026-07-27T12:14:03Z `attempt`: Stopped only confirmed stalled build tree, reran CI=true fast Windows build through approved route; dependency restore and unpacked packaging passed [node_modules; scripts/local-build.ps1] (worked)
- 2026-07-27T12:14:06Z `fix`: Approved build route restored node_modules from existing pnpm store and produced Phase 6 win-unpacked app [node_modules; scripts/local-build.ps1]
