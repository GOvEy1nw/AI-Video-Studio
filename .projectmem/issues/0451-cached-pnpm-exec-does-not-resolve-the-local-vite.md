# #0451 Cached pnpm exec does not resolve the local Vitest binary on Windows even though package scripts invoke it successfully.

- 2026-08-01T15:16:44Z `issue`: Cached pnpm exec does not resolve the local Vitest binary on Windows even though package scripts invoke it successfully. [frontend focused validation tooling]
- 2026-08-01T15:16:51Z `attempt`: Tried cached pnpm exec vitest for exact focused files; Windows command resolution reported vitest not recognized. [frontend focused validation tooling] (failed)
- 2026-08-01T15:17:02Z `attempt`: Invoked Vitest directly through node_modules/vitest/vitest.mjs; exact GenSpace accent files passed (2 files, 4 tests). [frontend focused validation tooling] (worked)
- 2026-08-01T15:17:06Z `fix`: Use node node_modules/vitest/vitest.mjs run <files> for exact focused Vitest validation when cached pnpm exec cannot resolve vitest. [frontend focused validation tooling]
