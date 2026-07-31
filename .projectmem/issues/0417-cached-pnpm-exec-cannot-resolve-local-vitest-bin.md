# #0417 Cached pnpm exec cannot resolve local vitest binary on Windows

- 2026-07-30T16:19:10Z `issue`: Cached pnpm exec cannot resolve local vitest binary on Windows [frontend validation tooling]
- 2026-07-30T16:19:15Z `attempt`: Tried cached pnpm exec vitest for focused test; Windows could not resolve vitest executable [frontend validation tooling] (failed)
- 2026-07-30T16:19:28Z `attempt`: Ran focused Vitest through node_modules/.bin/vitest.cmd; test execution succeeded [frontend validation tooling] (worked)
- 2026-07-30T16:19:32Z `fix`: Use repository node_modules/.bin/vitest.cmd for focused Windows runs when cached pnpm exec cannot resolve binaries [frontend validation tooling]
