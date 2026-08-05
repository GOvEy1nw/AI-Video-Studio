# #0575 AIVS-019 GenSpace activity prop change leaves existing gallery-hook fixture on removed currentTab contract.

- 2026-08-05T10:38:31Z `issue`: AIVS-019 GenSpace activity prop change leaves existing gallery-hook fixture on removed currentTab contract. [frontend/views/genspace/hooks/useGenSpaceGallery.test.tsx]
- 2026-08-05T10:38:56Z `attempt`: Aligned existing gallery hook fixture with explicit isActive contract. [frontend/views/genspace/hooks/useGenSpaceGallery.test.tsx] (partial)
- 2026-08-05T10:39:12Z `attempt`: Strict TypeScript passes after gallery fixture alignment. [frontend/views/genspace/hooks/useGenSpaceGallery.test.tsx] (worked)
- 2026-08-05T10:39:17Z `fix`: Existing gallery fixture now supplies explicit isActive, restoring strict typecheck. [frontend/views/genspace/hooks/useGenSpaceGallery.test.tsx]
