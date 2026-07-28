# #0342 Bare pnpm focused test command cannot verify pnpm 10.30.3 registry signature in managed environment

- 2026-07-28T10:52:25Z `issue`: Bare pnpm focused test command cannot verify pnpm 10.30.3 registry signature in managed environment [focused frontend validation]
- 2026-07-28T10:52:42Z `attempt`: Retried focused validation through cached Corepack pnpm; Vitest launched successfully [focused frontend validation] (worked)
- 2026-07-28T10:52:46Z `fix`: Use cached Corepack pnpm for repository test and typecheck commands when bare pnpm signature switching fails [focused frontend validation]
