# #0092 AIVS-015 Upscale uses native selects unlike shared AiVS controls and exposes a synthetic Unavailable menu option after catalog load

- 2026-08-17T08:12:16Z `issue`: AIVS-015 Upscale uses native selects unlike shared AiVS controls and exposes a synthetic Unavailable menu option after catalog load [frontend/views/genspace/components/UpscalePanel.tsx]
- 2026-08-17T08:13:09Z `attempt`: Replaced native method select with shared SettingsDropdown, removed the synthetic loaded option, and mapped the supported scale array onto a discrete slider [frontend/views/genspace/components/UpscalePanel.tsx] (worked)
- 2026-08-17T08:34:02Z `fix`: Upscale now uses AiVS SettingsDropdown without a synthetic Unavailable row and a discrete supported-scale slider; typecheck/build and real-Electron keyboard interaction passed [frontend/views/genspace/components/UpscalePanel.tsx]
