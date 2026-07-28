# #0302 Phase 9 pnpm dev:debug blocked before launch because package-manager signature verification cannot fetch registry metadata

- 2026-07-27T15:01:22Z `issue`: Phase 9 pnpm dev:debug blocked before launch because package-manager signature verification cannot fetch registry metadata [packageManager pnpm@10.30.3; dev:debug command bootstrap]
- 2026-07-27T15:01:35Z `attempt`: Used repository-compatible Corepack route; corepack resolved cached pnpm 10.30.3 without registry signature fetch [packageManager pnpm@10.30.3; dev:debug command bootstrap] (worked)
- 2026-07-27T15:01:52Z `attempt`: Corepack pnpm 10.30.3 launched dev:debug and reached Vite/Electron compilation, confirming package-manager bootstrap workaround [packageManager pnpm@10.30.3; dev:debug command bootstrap] (worked)
- 2026-07-27T15:01:58Z `fix`: Corepack uses cached repository-pinned pnpm 10.30.3, avoiding external wrapper registry verification and restoring command launch [packageManager pnpm@10.30.3; dev:debug command bootstrap]
