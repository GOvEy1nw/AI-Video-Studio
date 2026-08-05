# #0658 AIVS-026 adding playbackResolution to rAF dependencies restarts playback and interrupts audio when preview quality changes.

- 2026-08-05T18:15:49Z `issue`: AIVS-026 adding playbackResolution to rAF dependencies restarts playback and interrupts audio when preview quality changes. [frontend/views/editor/usePlaybackEngine.ts]
- 2026-08-05T18:16:16Z `attempt`: Moved lazy-pool resolution reads to a current ref so quality changes do not restart rAF playback. [frontend/views/editor/usePlaybackEngine.ts] (partial)
- 2026-08-05T18:16:31Z `fix`: Lazy pool reads current resolution via ref without rAF restart; focused checks pass. [frontend/views/editor/usePlaybackEngine.ts]
