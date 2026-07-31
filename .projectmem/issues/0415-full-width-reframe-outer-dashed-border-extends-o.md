# #0415 Full-width Reframe outer dashed border extends outside clipped canvas and loses right/bottom edges

- 2026-07-30T16:09:48Z `issue`: Full-width Reframe outer dashed border extends outside clipped canvas and loses right/bottom edges [frontend/views/genspace/video/OutpaintFrameOverlay.tsx]
- 2026-07-30T16:11:00Z `attempt`: Kept dashed border inside computed frame with box-border sizing; 10 focused shared/Image Reframe tests pass [frontend/views/genspace/video/OutpaintFrameOverlay.tsx] (worked)
- 2026-07-30T16:11:35Z `attempt`: Box-border regression passes strict TypeScript, 144 frontend tests, production Electron/frontend build, and diff check [frontend/views/genspace/video/OutpaintFrameOverlay.tsx] (worked)
- 2026-07-30T16:11:39Z `fix`: Reframe dashed border now uses border-box sizing, keeping full-width/full-height edges inside the clipped shared canvas [frontend/views/genspace/video/OutpaintFrameOverlay.tsx]
