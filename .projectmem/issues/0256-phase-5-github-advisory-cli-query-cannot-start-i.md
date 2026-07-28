# #0256 Phase 5 GitHub advisory CLI query cannot start in managed sandbox because gh config.yml access is denied

- 2026-07-27T11:04:06Z `issue`: Phase 5 GitHub advisory CLI query cannot start in managed sandbox because gh config.yml access is denied [tooling/gh]
- 2026-07-27T11:04:12Z `attempt`: Tried gh --version before advisory queries; sandbox denied reading AppData GitHub CLI config and command did not start [tooling/gh] (failed)
- 2026-07-27T11:05:03Z `attempt`: Replaced gh with unauthenticated public GitHub advisory REST queries through curl; all four exact Phase 5 package queries completed [tooling/gh] (worked)
- 2026-07-27T11:05:07Z `fix`: Public curl advisory queries bypassed inaccessible gh config and confirmed no advisories published since runbook review for exact Phase 5 targets [tooling/gh]
