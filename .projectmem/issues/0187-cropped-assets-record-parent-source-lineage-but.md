# #0187 Cropped assets record parent/source lineage but omit the crop recipe required for reproducible derivative metadata

- 2026-07-26T11:56:18Z `issue`: Cropped assets record parent/source lineage but omit the crop recipe required for reproducible derivative metadata [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-07-26T11:57:16Z `attempt`: Added the canonical crop recipe to AssetLineage and populated it when materializing a crop derivative; validation pending [frontend/types/project.ts] (partial)
- 2026-07-26T11:58:11Z `attempt`: Verified crop recipe lineage assignment with clean strict TypeScript and git diff checks [frontend/views/genspace/hooks/useGenSpaceController.tsx] (worked)
- 2026-07-26T11:58:17Z `fix`: Crop derivatives now persist the complete MediaCropRecipe alongside parent/source lineage [frontend/views/genspace/hooks/useGenSpaceController.tsx]
