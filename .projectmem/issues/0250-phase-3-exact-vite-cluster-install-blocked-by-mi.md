# #0250 Phase 3 exact Vite cluster install blocked by minimumReleaseAge for plugin-react 6.0.4 and transitive undici 7.29.0

- 2026-07-27T10:01:06Z `issue`: Phase 3 exact Vite cluster install blocked by minimumReleaseAge for plugin-react 6.0.4 and transitive undici 7.29.0 [package.json]
- 2026-07-27T10:01:10Z `attempt`: Ran exact reviewed add/remove commands under normal release-age policy; all transactions were rejected before changing dependencies [package.json] (failed)
- 2026-07-27T10:01:36Z `attempt`: Used one command-scoped minimumReleaseAge=0 exception for exact reviewed Vite cluster; install and direct renderer plugin removal completed [package.json] (worked)
- 2026-07-27T10:01:39Z `fix`: Exact Phase 3 packages installed through a command-scoped release-age exception; .npmrc policy remains unchanged [package.json]
