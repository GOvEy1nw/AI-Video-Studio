# #0171 Crop dialog test queried a decorative empty-alt image by the img role

- 2026-07-26T11:11:37Z `issue`: Crop dialog test queried a decorative empty-alt image by the img role [frontend/views/genspace/image/MediaCropDialog.test.tsx]
- 2026-07-26T11:11:46Z `attempt`: Gave the crop source preview a meaningful accessible name so the test and screen readers can identify it [frontend/views/genspace/image/MediaCropDialog.tsx] (worked)
- 2026-07-26T11:12:04Z `fix`: Crop source preview is accessible and all focused crop component tests pass [frontend/views/genspace/image/MediaCropDialog.tsx]
