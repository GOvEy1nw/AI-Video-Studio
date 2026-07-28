# #0299 Electron Builder collector warns package.json pnpm.overrides is ignored and must move to pnpm-workspace.yaml

- 2026-07-27T14:40:40Z `issue`: Electron Builder collector warns package.json pnpm.overrides is ignored and must move to pnpm-workspace.yaml [package.json; pnpm-lock.yaml; electron-builder]
- 2026-07-27T14:40:44Z `attempt`: Built unpacked Windows app with package.json overrides; build passed but Electron Builder's pnpm collector emitted repeated ignored-config warnings [package.json; pnpm-lock.yaml; electron-builder] (partial)
- 2026-07-27T14:42:16Z `attempt`: Moved overrides to pnpm-workspace.yaml, frozen install passed, and rebuilt unpacked app with no ignored-config warnings [pnpm-workspace.yaml; package.json; pnpm-lock.yaml; electron-builder] (worked)
- 2026-07-27T14:42:23Z `fix`: Security overrides now live in pnpm-workspace.yaml, matching pnpm 10 and Electron Builder collector expectations [pnpm-workspace.yaml; package.json; pnpm-lock.yaml; electron-builder]
