# #0224 Managed process backend rejected interrupt for hanging npm registry query

- 2026-07-26T19:31:50Z `issue`: Managed process backend rejected interrupt for hanging npm registry query [tooling/exec]
- 2026-07-26T19:31:59Z `attempt`: Sent Ctrl+C to hanging registry query; process backend does not support interrupts [tooling/exec] (failed)
- 2026-07-27T10:00:01Z `attempt`: Phase 3 npm registry freshness query hung in managed sandbox; process backend again rejected Ctrl+C [tooling/exec] (failed)
- 2026-07-27T11:08:26Z `attempt`: Tried Ctrl+C after Phase 5 pnpm reinstall produced no output for 90 seconds; process backend again rejected interrupts [tooling/exec] (failed)
