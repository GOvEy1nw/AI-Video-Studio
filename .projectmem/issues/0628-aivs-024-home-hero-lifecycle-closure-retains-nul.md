# #0628 AIVS-024 Home hero lifecycle closure retains nullable video after ref capture.

- 2026-08-05T16:48:28Z `issue`: AIVS-024 Home hero lifecycle closure retains nullable video after ref capture. [frontend/views/Home.tsx:151]
- 2026-08-05T16:48:38Z `attempt`: Guarded hero lifecycle effect after ref capture so cleanup uses non-null media element. [frontend/views/Home.tsx:146] (partial)
- 2026-08-05T16:48:48Z `attempt`: Ran pnpm typecheck:ts after guarding hero video; nullable ref error is gone. [frontend/views/Home.tsx:146] (worked)
- 2026-08-05T16:48:51Z `fix`: Home hero lifecycle now narrows its video ref before use; strict TypeScript passes. [frontend/views/Home.tsx:146]
