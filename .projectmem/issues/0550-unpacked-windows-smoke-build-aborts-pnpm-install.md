# #0550 Unpacked Windows smoke build aborts pnpm install because non-TTY cleanup requires CI=true

- 2026-08-04T15:56:15Z `issue`: Unpacked Windows smoke build aborts pnpm install because non-TTY cleanup requires CI=true [scripts/local-build.ps1 / pnpm build:fast:win]
- 2026-08-04T15:56:23Z `attempt`: Ran pnpm build:fast:win without CI; pnpm aborted modules cleanup in non-TTY environment. [scripts/local-build.ps1] (failed)
- 2026-08-04T16:33:23Z `attempt`: Retry with CI=true progressed past non-TTY pnpm guard but was intentionally terminated when user requested port-5173 dev smoke; unpacked build remains unverified. [scripts/local-build.ps1 / pnpm build:fast:win] (partial)
