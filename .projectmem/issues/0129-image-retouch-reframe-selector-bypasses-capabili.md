# #0129 Image Retouch/Reframe selector bypasses capability-aware workflow profile selection

- 2026-08-20T16:06:32Z `issue`: Image Retouch/Reframe selector bypasses capability-aware workflow profile selection [frontend/views/genspace/image/ImageModeTabs.tsx]
- 2026-08-20T16:10:30Z `attempt`: Routed ImageModeTabs through controller workflow selection and moved compatibility checks before mode mutation [frontend/views/genspace/image/ImageModeTabs.tsx] (worked)
- 2026-08-20T16:20:06Z `fix`: Retouch and Reframe workflow selection resolves a compatible installed profile before mutating image mode, preserving workflow-led model selection. [frontend/views/genspace/hooks/useGenSpaceController.tsx]
