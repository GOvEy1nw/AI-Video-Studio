# #0705 AIVS-042 SFX panel hides the normal model-download control when the MMAudio pack is not installed

- 2026-08-08T16:41:59Z `issue`: AIVS-042 SFX panel hides the normal model-download control when the MMAudio pack is not installed [frontend/views/genspace/audio/SfxGenPanel.tsx]
- 2026-08-08T16:44:17Z `attempt`: Added the existing ModelDownloadButton fallback when no installed SFX profile is selectable [frontend/views/genspace/audio/SfxGenPanel.tsx] (worked)
- 2026-08-08T16:44:23Z `fix`: SFX now exposes the normal model manager download path; focused UI tests, TypeScript, and build pass [frontend/views/genspace/audio/SfxGenPanel.tsx]
