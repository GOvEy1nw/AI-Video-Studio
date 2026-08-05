# #0655 AIVS-026 lazy pool entries do not receive current playback-resolution styles because map mutation does not rerun resolution effect.

- 2026-08-05T18:08:29Z `issue`: AIVS-026 lazy pool entries do not receive current playback-resolution styles because map mutation does not rerun resolution effect. [frontend/views/editor/usePlaybackEngine.ts]
- 2026-08-05T18:09:13Z `attempt`: Applied current playback-resolution styles on lazy pooled-video creation and restarted rAF when playback resolution changes. [frontend/views/editor/usePlaybackEngine.ts] (partial)
- 2026-08-05T18:09:32Z `fix`: Lazy pooled videos now receive current playback-resolution styling; focused checks pass. [frontend/views/editor/usePlaybackEngine.ts]
