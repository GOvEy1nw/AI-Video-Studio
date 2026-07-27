# #0233 Phase 2 scripted focused Vitest syntax forwarded a literal -- and ran the full suite instead of one file

- 2026-07-26T19:50:16Z `issue`: Phase 2 scripted focused Vitest syntax forwarded a literal -- and ran the full suite instead of one file [package.json]
- 2026-07-26T19:50:24Z `attempt`: Used corepack pnpm exec vitest run <file>; native-file-path 3 tests and media-import 2 tests each ran as true focused checks [package.json] (worked)
- 2026-07-26T19:50:28Z `fix`: Recorded valid focused Vitest invocation using pnpm exec vitest run [package.json]
