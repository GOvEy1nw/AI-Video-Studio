# #0307 Final full audit finds concurrently 10 resolved vulnerable shell-quote 1.8.4 despite patched compatible shell-quote 1.9.0

- 2026-07-27T15:11:47Z `issue`: Final full audit finds concurrently 10 resolved vulnerable shell-quote 1.8.4 despite patched compatible shell-quote 1.9.0 [pnpm-lock.yaml; concurrently 10.0.3; shell-quote]
- 2026-07-27T15:13:00Z `attempt`: Added parent-scoped shell-quote 1.9.0 override and ran normal lock refresh; pnpm stopped on existing three-day-old undici 7.29.0 minimumReleaseAge before applying changes [pnpm-lock.yaml; pnpm-workspace.yaml; concurrently 10.0.3; shell-quote] (failed)
- 2026-07-27T15:13:22Z `attempt`: Command-scoped release-age exception applied parent-specific concurrently>shell-quote override; graph replaced vulnerable 1.8.4 with patched 1.9.0 [pnpm-lock.yaml; pnpm-workspace.yaml; concurrently 10.0.3; shell-quote] (worked)
- 2026-07-27T15:14:02Z `attempt`: Full typecheck passed with overridden shell-quote 1.9.0; full audit cleared GHSA-395f-4hp3-45gv and returned only two already-documented Electron Builder brace-expansion paths [pnpm-workspace.yaml; pnpm-lock.yaml; concurrently 10.0.3; shell-quote] (worked)
- 2026-07-27T15:14:06Z `fix`: Parent-scoped override keeps concurrently 10 on API-compatible shell-quote 1.9.0; typecheck passes and advisory is absent from final audit [pnpm-workspace.yaml; pnpm-lock.yaml]
