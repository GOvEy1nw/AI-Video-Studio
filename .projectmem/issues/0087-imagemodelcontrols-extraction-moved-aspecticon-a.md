# #0087 ImageModelControls extraction moved AspectIcon although Video output settings still use it in GenSpace.

- 2026-07-24T19:56:58Z `issue`: ImageModelControls extraction moved AspectIcon although Video output settings still use it in GenSpace. [frontend/views/GenSpace.tsx]
- 2026-07-24T19:57:08Z `attempt`: Exported the shared AspectIcon from ImageModelControls and imported it for Video settings. [frontend/views/genspace/components/ImageModelControls.tsx] (partial)
- 2026-07-24T19:57:17Z `attempt`: Strict TypeScript passes with AspectIcon shared by image and video settings. [frontend/views/genspace/components/ImageModelControls.tsx] (worked)
- 2026-07-24T19:57:20Z `fix`: AspectIcon remains available to both extracted image controls and existing video output controls. [frontend/views/genspace/components/ImageModelControls.tsx]
