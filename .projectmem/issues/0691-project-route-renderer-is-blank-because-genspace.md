# #0691 Project route renderer is blank because GenSpaceSidebarController now requires speech, but useGenSpaceController still omits the speech controller, so TypeScript production compilation fails.

- 2026-08-07T08:09:27Z `issue`: Project route renderer is blank because GenSpaceSidebarController now requires speech, but useGenSpaceController still omits the speech controller, so TypeScript production compilation fails. [frontend/views/genspace/hooks/useGenSpaceController.tsx:733]
- 2026-08-07T08:09:50Z `attempt`: Made the not-yet-wired Speech sidebar controller optional so the existing project composition remains type-safe while Speech workflow wiring is unfinished. [frontend/views/genspace/types.ts] (worked)
- 2026-08-07T08:10:26Z `fix`: Confirmed project renderer build recovery: pnpm typecheck:ts and pnpm build:frontend both pass after making the unfinished Speech sidebar field optional. [frontend/views/genspace/types.ts]
