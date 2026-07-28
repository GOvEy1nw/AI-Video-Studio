# #0261 Exact Tailwind 4.3.3 install blocked by minimumReleaseAge because Electron resolves two-day-old transitive undici 7.29.0

- 2026-07-27T11:18:28Z `issue`: Exact Tailwind 4.3.3 install blocked by minimumReleaseAge because Electron resolves two-day-old transitive undici 7.29.0 [package.json]
- 2026-07-27T11:18:32Z `attempt`: Ran exact Tailwind 4.3.3 dev dependency add under normal policy; transaction stopped before changes on transitive undici minimumReleaseAge [package.json] (failed)
- 2026-07-27T11:18:50Z `attempt`: Reran exact Tailwind 4.3.3 add with command-scoped minimum-release-age=0; packages installed and repository policy stayed unchanged [package.json] (worked)
- 2026-07-27T11:18:53Z `fix`: Exact Tailwind 4.3.3 cluster installed through one-shot release-age exception without changing .npmrc [package.json]
