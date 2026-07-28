# #0329 Managed approval rejects pnpm outdated/audit because npm would receive private repository dependency graph without explicit consent

- 2026-07-27T19:58:43Z `issue`: Managed approval rejects pnpm outdated/audit because npm would receive private repository dependency graph without explicit consent [Phase 11 dependency security review]
- 2026-07-27T19:58:48Z `attempt`: Requested required outdated and production/full audit queries; approval rejected pending explicit user consent to disclose dependency graph to npm [Phase 11 dependency security review] (failed)
- 2026-07-28T06:58:48Z `attempt`: User explicitly authorized pnpm outdated, pnpm audit --prod, and pnpm audit dependency-graph disclosure to npm [Phase 11 dependency security review] (partial)
- 2026-07-28T06:59:08Z `attempt`: Authorized queries completed: three documented major deferrals, production audit clean, full audit retains two known dev-only Electron Builder brace-expansion paths [Phase 11 dependency security review] (worked)
- 2026-07-28T06:59:13Z `fix`: Required npm outdated and audit evidence completed with explicit consent; no production vulnerabilities and only previously accepted dev-only findings remain [Phase 11 dependency security review]
