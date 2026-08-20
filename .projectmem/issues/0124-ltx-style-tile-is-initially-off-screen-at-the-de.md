# #0124 LTX Style tile is initially off-screen at the default Electron width because it follows all media slots

- 2026-08-19T17:27:06Z `issue`: LTX Style tile is initially off-screen at the default Electron width because it follows all media slots [frontend/views/genspace/video/VideoMediaInputs.tsx]
- 2026-08-19T17:28:08Z `attempt`: Placed the Style tile first in the media-input row so it is visible without horizontal scrolling [frontend/views/genspace/video/VideoMediaInputs.tsx] (worked)
- 2026-08-19T17:29:04Z `fix`: LTX Style is now the first media-input tile, visible at 1384x835 without scrolling and confirmed to open the modal [frontend/views/genspace/video/VideoMediaInputs.tsx]
