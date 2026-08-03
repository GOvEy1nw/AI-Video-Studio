# #0499 Assumed VideoEditor path was wrong during AssetContextMenu caller inspection

- 2026-08-03T13:07:45Z `issue`: Assumed VideoEditor path was wrong during AssetContextMenu caller inspection [frontend/VideoEditor.tsx]
- 2026-08-03T13:07:49Z `attempt`: VideoEditor caller lookup failed at frontend/VideoEditor.tsx; current path is under frontend/views [frontend/VideoEditor.tsx] (failed)
- 2026-08-03T13:11:00Z `attempt`: Removed SDR-to-HDR and Continue Video from standard VIDEO_GUIDE_ROLE_OPTIONS while preserving legacy media role constants [frontend/views/genspace/constants.ts] (partial)
- 2026-08-03T13:11:28Z `attempt`: Added context-menu trigger styling and right-facing submenu placement to UseImageDropdown [frontend/components/UseImageDropdown.tsx] (partial)
- 2026-08-03T13:12:10Z `attempt`: Added shared UseVideoDropdown with Reference and all curated Video Tool options plus max-h-60 scrolling [frontend/components/UseVideoDropdown.tsx] (partial)
- 2026-08-03T13:12:37Z `attempt`: Replaced AssetContextMenu image direct actions and video Reframe action with Use Image and Use Video submenus [frontend/views/editor/AssetContextMenu.tsx] (partial)
- 2026-08-03T13:12:51Z `attempt`: Replaced selected-generation video Reframe action with UseVideoDropdown [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (partial)
- 2026-08-03T13:13:02Z `attempt`: Updated GenSpace overlay contract to pass VideoUseTarget into AssetContextMenu [frontend/views/genspace/GenSpaceOverlays.tsx] (partial)
- 2026-08-03T13:13:31Z `attempt`: Controller patch did not apply because selected-generation and overlay prop blocks differ in current source [frontend/views/genspace/hooks/useGenSpaceController.tsx] (failed)
