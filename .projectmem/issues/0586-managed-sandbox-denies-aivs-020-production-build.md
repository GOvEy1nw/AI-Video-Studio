# #0586 Managed sandbox denies AIVS-020 production build creating dist-electron output directory.

- 2026-08-05T12:47:00Z `issue`: Managed sandbox denies AIVS-020 production build creating dist-electron output directory. [C:\tmp\AI-Video-Studio-AIVS-020 / pnpm build:frontend]
- 2026-08-05T12:47:04Z `attempt`: Ran corepack pnpm build:frontend in sandbox; Rolldown transformed modules but failed EPERM creating dist-electron. [C:\tmp\AI-Video-Studio-AIVS-020 / pnpm build:frontend] (failed)
- 2026-08-05T12:47:23Z `attempt`: Reran corepack pnpm build:frontend with approved output access; renderer, Electron main, and preload builds passed. [C:\tmp\AI-Video-Studio-AIVS-020 / pnpm build:frontend] (worked)
- 2026-08-05T12:47:27Z `fix`: AIVS-020 production renderer, Electron main, and preload build passes with approved dist output access. [C:\tmp\AI-Video-Studio-AIVS-020 / pnpm build:frontend]
