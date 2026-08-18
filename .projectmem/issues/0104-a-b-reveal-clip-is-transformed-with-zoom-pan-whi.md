# #0104 A/B reveal clip is transformed with zoom/pan while the divider stays viewport-fixed, so the visual split can drift away from its draggable line.

- 2026-08-17T12:32:46Z `issue`: A/B reveal clip is transformed with zoom/pan while the divider stays viewport-fixed, so the visual split can drift away from its draggable line. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
- 2026-08-17T12:34:18Z `attempt`: Kept comparison clipping in viewport coordinates and applied the shared transform only to matched A/B image layers. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (worked)
- 2026-08-17T12:36:05Z `attempt`: Moved divider and clip into the same untransformed inner content frame so reveal percentages align across the full drag range. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (worked)
- 2026-08-17T12:37:20Z `attempt`: Applied compare transforms to identical full-size A/B layers while keeping Version B clipping outside its transform layer. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (worked)
- 2026-08-17T12:56:49Z `fix`: Confirmed in real Electron that A/B images zoom and pan together while the viewport-fixed reveal remains aligned with the draggable divider. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
