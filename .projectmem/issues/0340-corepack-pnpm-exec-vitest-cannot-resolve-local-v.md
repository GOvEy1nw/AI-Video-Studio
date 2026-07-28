# #0340 Corepack pnpm exec vitest cannot resolve local Vitest binary on Windows despite project test script availability

- 2026-07-28T10:28:07Z `issue`: Corepack pnpm exec vitest cannot resolve local Vitest binary on Windows despite project test script availability [focused frontend validation]
- 2026-07-28T10:28:16Z `attempt`: Tried corepack pnpm exec vitest run; Windows could not resolve vitest executable [focused frontend validation] (failed)
- 2026-07-28T10:28:40Z `attempt`: Used project test:frontend script with focused file arguments; Vitest launched and ran requested files [focused frontend validation] (worked)
- 2026-07-28T10:28:44Z `fix`: Focused Vitest validation now uses repository test:frontend script instead of unresolved pnpm exec binary [focused frontend validation]
