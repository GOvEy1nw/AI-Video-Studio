# #0296 Phase 9 js-yaml patch resolution blocked by pnpm minimumReleaseAge on existing undici 7.29.0

- 2026-07-27T14:21:16Z `issue`: Phase 9 js-yaml patch resolution blocked by pnpm minimumReleaseAge on existing undici 7.29.0 [package.json; pnpm-lock.yaml]
- 2026-07-27T14:21:19Z `attempt`: Ran exact js-yaml 4.3.0 update; pnpm refused existing three-day-old undici 7.29.0 under minimumReleaseAge [package.json; pnpm-lock.yaml] (failed)
- 2026-07-27T14:21:36Z `attempt`: Retried exact js-yaml update with the established command-scoped minimum-release-age exception; only js-yaml moved to 4.3.0 plus lock resolution metadata [package.json; pnpm-lock.yaml] (worked)
- 2026-07-27T14:21:39Z `fix`: Command-scoped release-age exception allowed reviewed js-yaml 4.3.0 patch without changing repository policy [package.json; pnpm-lock.yaml]
