# #0305 Sandboxed clean-install gate partially removes node_modules but denies linked package files, leaving an incomplete dependency tree

- 2026-07-27T15:09:37Z `issue`: Sandboxed clean-install gate partially removes node_modules but denies linked package files, leaving an incomplete dependency tree [node_modules; Phase 9 deterministic install]
- 2026-07-27T15:09:53Z `attempt`: Removed the verified workspace node_modules path with normal linked-file access; no broader path targeted [node_modules; Phase 9 deterministic install] (worked)
- 2026-07-27T15:10:23Z `attempt`: Clean corepack pnpm install --frozen-lockfile reconstructed 430 packages entirely from the existing store with pnpm 10.30.3 and no lockfile mutation [node_modules; Phase 9 deterministic install] (worked)
- 2026-07-27T15:10:26Z `fix`: Verified workspace-only removal plus clean frozen reinstall; final dependency graph is reproducible from the lockfile [node_modules; Phase 9 deterministic install]
