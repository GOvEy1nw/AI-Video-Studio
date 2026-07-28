# #0319 validate:frontend nested bare pnpm resolves host pnpm 11 instead of project pnpm 10.30.3

- 2026-07-27T16:27:35Z `issue`: validate:frontend nested bare pnpm resolves host pnpm 11 instead of project pnpm 10.30.3 [package.json validate:frontend]
- 2026-07-27T16:27:38Z `attempt`: Ran validate:frontend under Corepack pnpm 10; nested bare pnpm commands selected global pnpm 11.10.0 and failed package-manager guard [package.json validate:frontend] (failed)
- 2026-07-27T16:27:48Z `attempt`: Pinned all validate:frontend child commands through Corepack pnpm, matching existing full typecheck discipline [package.json validate:frontend] (partial)
- 2026-07-27T16:28:18Z `attempt`: Reran validate:frontend; Corepack child commands stayed on pnpm 10.30.3 and reached Vitest, confirming package-manager fix [package.json validate:frontend] (worked)
- 2026-07-27T16:28:27Z `fix`: validate:frontend now pins all nested package commands to project Corepack pnpm 10.30.3 [package.json]
