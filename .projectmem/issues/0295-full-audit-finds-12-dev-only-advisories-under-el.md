# #0295 Full audit finds 12 dev-only advisories under electron-builder 26.15.3, including critical tar DoS

- 2026-07-27T14:19:29Z `issue`: Full audit finds 12 dev-only advisories under electron-builder 26.15.3, including critical tar DoS [package.json; pnpm-lock.yaml; electron-builder]
- 2026-07-27T14:35:27Z `attempt`: Tried exact pnpm update selectors for tar 7.5.21, fast-uri 3.1.4, and brace-expansion; pnpm treated transitive-only selectors as already up to date [pnpm-lock.yaml; electron-builder] (failed)
- 2026-07-27T14:36:07Z `attempt`: Tried pnpm dedupe --check to preview compatible transitive refresh; non-TTY sandbox aborted before producing a change set [pnpm-lock.yaml; node_modules; electron-builder] (failed)
- 2026-07-27T14:37:51Z `attempt`: Added minimum patched overrides and ran CI-mode install; pnpm correctly refused because CI defaults to frozen lockfile while override config changed [package.json; pnpm-lock.yaml; electron-builder] (failed)
- 2026-07-27T14:39:27Z `attempt`: Compared brace-expansion 1/2/5 APIs with a direct require harness; v5 export shape was not callable through the legacy default/function assumption [brace-expansion; minimatch; electron-builder] (failed)
- 2026-07-27T14:39:47Z `attempt`: Applied compatible minimum-patch overrides; full audit dropped from 12 Electron Builder findings to two dev-only GHSA-mh99 paths, with v5 API incompatibility verified [package.json; pnpm-lock.yaml; electron-builder] (worked)
- 2026-07-27T14:39:50Z `fix`: Patched tar, fast-uri, and compatible brace-expansion majors; two unreachable dev-only brace findings are documented for upstream Electron Builder resolution [package.json; pnpm-lock.yaml; electron-builder]
