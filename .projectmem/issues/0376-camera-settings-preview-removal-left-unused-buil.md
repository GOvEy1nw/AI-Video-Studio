# #0376 Camera Settings preview removal left unused buildFramingPrefix import, breaking strict TypeScript.

- 2026-07-29T13:45:17Z `issue`: Camera Settings preview removal left unused buildFramingPrefix import, breaking strict TypeScript. [frontend/views/genspace/components/FramingControl.tsx]
- 2026-07-29T13:45:33Z `attempt`: Removed orphaned buildFramingPrefix import after preview copy was deleted; awaiting strict TypeScript rerun. [frontend/views/genspace/components/FramingControl.tsx] (partial)
- 2026-07-29T13:45:52Z `attempt`: Strict TypeScript passes after removing unused buildFramingPrefix import. [frontend/views/genspace/components/FramingControl.tsx] (worked)
- 2026-07-29T13:46:00Z `fix`: Removed stale buildFramingPrefix import left by Camera Settings preview cleanup; strict TypeScript restored. [frontend/views/genspace/components/FramingControl.tsx]
