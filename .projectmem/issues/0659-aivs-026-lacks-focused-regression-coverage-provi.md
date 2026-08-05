# #0659 AIVS-026 lacks focused regression coverage proving preview-quality changes preserve active playback rAF.

- 2026-08-05T18:20:52Z `issue`: AIVS-026 lacks focused regression coverage proving preview-quality changes preserve active playback rAF. [frontend/views/editor/usePlaybackEngine.test.tsx]
- 2026-08-05T18:21:06Z `attempt`: Added focused hook coverage that rerenders preview quality during active playback; rAF cleanup remains untouched. [frontend/views/editor/usePlaybackEngine.test.tsx] (worked)
- 2026-08-05T18:21:09Z `fix`: Preview-quality continuity now has a focused active-playback rAF regression test. [frontend/views/editor/usePlaybackEngine.test.tsx]
