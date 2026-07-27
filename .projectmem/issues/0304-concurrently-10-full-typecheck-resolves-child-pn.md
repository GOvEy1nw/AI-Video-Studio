# #0304 Concurrently 10 full typecheck resolves child pnpm as global v11.10.0, so both project-pinned pnpm 10 scripts fail before running

- 2026-07-27T15:07:02Z `issue`: Concurrently 10 full typecheck resolves child pnpm as global v11.10.0, so both project-pinned pnpm 10 scripts fail before running [package.json:25; concurrently 10; pnpm 10.30.3]
- 2026-07-27T15:07:52Z `attempt`: Ran both typecheck children through explicit corepack pnpm commands under concurrently 10; TypeScript and Pyright completed successfully with project-pinned pnpm 10 [package.json:25; concurrently 10; pnpm 10.30.3] (worked)
- 2026-07-27T15:08:19Z `attempt`: Updated typecheck script to invoke both child pnpm commands through Corepack; exact corepack pnpm typecheck now passes TypeScript and Pyright [package.json:25] (worked)
- 2026-07-27T15:08:21Z `fix`: Pinned nested typecheck commands to Corepack so concurrently 10 preserves project pnpm 10.30.3 instead of resolving global pnpm 11 [package.json:25]
