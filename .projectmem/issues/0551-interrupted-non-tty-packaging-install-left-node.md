# #0551 Interrupted non-TTY packaging install left node_modules incomplete and removed Vite executable

- 2026-08-04T15:59:45Z `issue`: Interrupted non-TTY packaging install left node_modules incomplete and removed Vite executable [node_modules / pnpm install recovery]
- 2026-08-04T15:59:58Z `attempt`: Offline frozen pnpm install could not restore dependencies because class-variance-authority tarball was absent from local store. [node_modules / pnpm install recovery] (failed)
- 2026-08-04T16:00:43Z `attempt`: Online frozen pnpm install downloaded dependencies but sandbox denied package linking with EPERM under node_modules/.pnpm. [node_modules / pnpm install recovery] (failed)
- 2026-08-04T16:01:21Z `attempt`: Escalated frozen pnpm install restored all 430 lockfile packages successfully after sandbox EPERM. [node_modules / pnpm install recovery] (worked)
- 2026-08-04T16:01:26Z `fix`: Restored complete lockfile-pinned node_modules with approved pnpm install; no dependency or lockfile changes. [node_modules / pnpm install recovery]
