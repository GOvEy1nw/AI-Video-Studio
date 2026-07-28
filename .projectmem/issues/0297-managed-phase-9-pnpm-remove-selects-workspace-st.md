# #0297 Managed Phase 9 pnpm remove selects workspace store incompatible with node_modules linked from user store

- 2026-07-27T14:21:47Z `issue`: Managed Phase 9 pnpm remove selects workspace store incompatible with node_modules linked from user store [package.json; pnpm-lock.yaml; node_modules]
- 2026-07-27T14:21:50Z `attempt`: Removed unused js-yaml/type declarations in managed sandbox; pnpm rejected mismatched workspace store versus existing user-store links [package.json; pnpm-lock.yaml; node_modules] (failed)
- 2026-07-27T14:22:09Z `attempt`: Retried removal with approved existing user-store access; unused js-yaml and @types/js-yaml direct declarations were removed [package.json; pnpm-lock.yaml; node_modules] (worked)
- 2026-07-27T14:22:14Z `fix`: Approved user-store route completed unused direct js-yaml/type removal without reinstalling unrelated packages [package.json; pnpm-lock.yaml; node_modules]
