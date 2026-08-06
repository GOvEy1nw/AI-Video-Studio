# #0677 Video Quick Gen shows an unavailable LTX profile as selected when no video model files are installed instead of presenting the Download Models action.

- 2026-08-06T11:32:53Z `issue`: Video Quick Gen shows an unavailable LTX profile as selected when no video model files are installed instead of presenting the Download Models action. [frontend/views/genspace/video/VideoGenPanel.tsx]
- 2026-08-06T11:42:58Z `attempt`: Gated Video model picker on installed profiles while preserving curated profile metadata for unchanged no-model layout. [frontend/views/genspace/video/VideoGenPanel.tsx] (worked)
- 2026-08-06T11:47:01Z `fix`: Verified Video shows Download Models when no video profile is installed while retaining normal layout metadata. [frontend/views/genspace/video/VideoGenPanel.tsx]
