# #0230 Exact Electron 43.2.0 install is blocked by repository minimumReleaseAge because patch is five days old

- 2026-07-26T19:45:54Z `issue`: Exact Electron 43.2.0 install is blocked by repository minimumReleaseAge because patch is five days old [package.json]
- 2026-07-26T19:46:47Z `attempt`: Installed exact reviewed Electron 43.2.0 normally; pnpm rejected it under 10080-minute minimum release age [package.json] (failed)
- 2026-07-26T19:47:11Z `attempt`: Used command-scoped minimum-release-age=0 for exact reviewed versions; Electron 43.2.0 and @types/node 24.13.3 installed, .npmrc unchanged [package.json] (worked)
- 2026-07-26T19:47:15Z `fix`: Installed exact reviewed Phase 2 targets through a one-shot release-age exception without weakening repository policy [package.json]
