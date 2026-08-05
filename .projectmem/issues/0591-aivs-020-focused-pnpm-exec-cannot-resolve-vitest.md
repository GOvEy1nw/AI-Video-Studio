# #0591 AIVS-020 focused pnpm exec cannot resolve Vitest from isolated worktree junction.

- 2026-08-05T12:59:37Z `issue`: AIVS-020 focused pnpm exec cannot resolve Vitest from isolated worktree junction. [C:\tmp\AI-Video-Studio-AIVS-020 / pnpm exec vitest]
- 2026-08-05T12:59:42Z `attempt`: Tried corepack pnpm exec vitest for one focused file; pnpm could not resolve the Vitest command from junctioned dependencies. [C:\tmp\AI-Video-Studio-AIVS-020 / pnpm exec vitest] (failed)
- 2026-08-05T12:59:57Z `attempt`: Used repository test:frontend script with focused-file argument; Vitest ran successfully and all 161 frontend tests passed. [C:\tmp\AI-Video-Studio-AIVS-020 / pnpm test:frontend] (worked)
- 2026-08-05T13:00:01Z `fix`: AIVS-020 frontend verification uses repository test:frontend script; 40 files and 161 tests pass in isolated worktree. [C:\tmp\AI-Video-Studio-AIVS-020 / pnpm test:frontend]
