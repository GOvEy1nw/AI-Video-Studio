# #0293 Phase 9 npm registry metadata queries return only config warnings and no package data in managed sandbox

- 2026-07-27T13:54:16Z `issue`: Phase 9 npm registry metadata queries return only config warnings and no package data in managed sandbox [docs/dependency-modernisation/09_LOW_RISK_PACKAGE_REFRESH.md; npm registry]
- 2026-07-27T13:54:20Z `attempt`: Queried exact latest manifests for five outdated packages in parallel; each returned only npm minimum-release-age warning before timeout/no metadata [npm registry; docs/dependency-modernisation/09_LOW_RISK_PACKAGE_REFRESH.md] (failed)
- 2026-07-27T15:05:13Z `attempt`: Approved registry route later returned exact package metadata needed for Phase 9 target review, clearing the managed-sandbox network limitation [docs/dependency-modernisation/09_LOW_RISK_PACKAGE_REFRESH.md; npm registry] (worked)
- 2026-07-27T15:05:15Z `fix`: Explicitly approved registry access supplied Phase 9 package metadata; no repository workaround or policy change required [docs/dependency-modernisation/09_LOW_RISK_PACKAGE_REFRESH.md; npm registry]
