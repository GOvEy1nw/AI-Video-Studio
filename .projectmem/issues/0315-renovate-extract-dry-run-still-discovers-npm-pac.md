# #0315 Renovate extract dry-run still discovers npm package files under protected Wan2GP tree with initial ignorePaths globs

- 2026-07-27T16:12:06Z `issue`: Renovate extract dry-run still discovers npm package files under protected Wan2GP tree with initial ignorePaths globs [renovate.json]
- 2026-07-27T16:12:30Z `attempt`: Changed protected ignorePaths to repository-agnostic **/prefix/** globs matching Renovate documentation examples [renovate.json] (partial)
- 2026-07-27T16:14:44Z `attempt`: Added allowlisted includePaths plus Node/pnpm major limits and disabled GitHub Actions Python-version updates as defense-in-depth [renovate.json] (partial)
- 2026-07-27T16:16:31Z `attempt`: Ran full no-write Renovate 43.272.4 dry-run; config allowlist loaded and no Wan2GP/backend runtime proposal context appeared [renovate.json] (worked)
- 2026-07-27T16:16:35Z `fix`: Renovate includePaths and protected ignorePaths prevent generic runtime proposals; full dry-run produces only app/tooling branches [renovate.json]
