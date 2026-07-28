# #0052 Music prompt controls diverge from image/video selector and duration styling; settings button is oversized.

- 2026-07-21T13:18:17Z `issue`: Music prompt controls diverge from image/video selector and duration styling; settings button is oversized. [frontend/components/music/MusicModeControls.tsx]
- 2026-07-21T13:25:09Z `attempt`: Extracted the existing GenSpace dropdown and reused it for music model/vocal controls; replaced duration presets with a native single-thumb slider and settings text with a cog. [frontend/components/music/MusicModeControls.tsx; frontend/components/SettingsDropdown.tsx; frontend/views/GenSpace.tsx] (partial)
- 2026-07-21T13:28:58Z `attempt`: TypeScript passed and native Electron accessibility/screenshot showed styled ACE-Step model, Instrumental, clock-duration, and cog settings controls. [frontend/components/music/MusicModeControls.tsx; frontend/components/SettingsDropdown.tsx] (worked)
- 2026-07-21T13:29:03Z `fix`: Music model/vocal controls now reuse the shared GenSpace dropdown; duration uses clock/seconds with a single-thumb slider; settings is cog-only. [frontend/components/music/MusicModeControls.tsx]
