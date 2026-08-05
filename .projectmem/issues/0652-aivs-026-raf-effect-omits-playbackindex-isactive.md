# #0652 AIVS-026 rAF effect omits playbackIndex/isActive dependencies, so editing timeline during playback can retain stale indexed media.

- 2026-08-05T18:04:19Z `issue`: AIVS-026 rAF effect omits playbackIndex/isActive dependencies, so editing timeline during playback can retain stale indexed media. [frontend/views/editor/usePlaybackEngine.ts:211]
- 2026-08-05T18:04:59Z `attempt`: Restarted playback rAF on material index/activity changes so it cannot retain stale media selection. [frontend/views/editor/usePlaybackEngine.ts] (partial)
- 2026-08-05T18:05:18Z `fix`: Playback rAF now restarts for latest material index/activity state; focused checks pass. [frontend/views/editor/usePlaybackEngine.ts]
