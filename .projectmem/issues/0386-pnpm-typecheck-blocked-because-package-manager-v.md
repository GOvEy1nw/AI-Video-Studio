# #0386 pnpm typecheck blocked because package-manager version signature verification could not reach/verify registry packages

- 2026-07-29T15:02:22Z `issue`: pnpm typecheck blocked because package-manager version signature verification could not reach/verify registry packages [frontend/typecheck tooling]
- 2026-07-29T15:04:33Z `attempt`: Retried typecheck with --pm-on-fail=ignore; nested dependency status install did not inherit flag and hit same verification failure [frontend/typecheck tooling] (failed)
- 2026-07-29T15:06:09Z `attempt`: Retried with npm_config_pm_on_fail=ignore; pnpm did not map snake-case environment key to pmOnFail [frontend/typecheck tooling] (failed)
- 2026-07-29T15:07:31Z `attempt`: Tested camel-case npm_config_pmOnFail; global pnpm still attempted signed 10.30.3 download [frontend/typecheck tooling] (failed)
- 2026-07-29T15:08:47Z `attempt`: Ran repository-installed tsc directly, avoiding pnpm's offline version switch; TypeScript check passed [frontend/typecheck tooling] (worked)
- 2026-07-29T15:08:54Z `fix`: Validation can proceed offline with repository-installed binaries; TypeScript check passed without lockfile/config changes [frontend/typecheck tooling]
