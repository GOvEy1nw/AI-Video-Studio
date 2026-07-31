# #0410 Strict TypeScript finds stale hasPadding and formatPaddingLabel after Image Reframe status/label UI was removed

- 2026-07-30T14:24:46Z `issue`: Strict TypeScript finds stale hasPadding and formatPaddingLabel after Image Reframe status/label UI was removed [frontend/views/genspace/image/ImageOutpaintEditor.tsx; frontend/views/genspace/video/OutpaintFrameOverlay.tsx]
- 2026-07-30T14:31:59Z `attempt`: Removed only orphaned hasPadding declaration and formatPaddingLabel import left by removed Image Reframe labels; strict TypeScript passes [frontend/views/genspace/image/ImageOutpaintEditor.tsx; frontend/views/genspace/video/OutpaintFrameOverlay.tsx] (worked)
- 2026-07-30T14:32:04Z `fix`: Strict TypeScript restored without changing removed label behavior [frontend/views/genspace/image/ImageOutpaintEditor.tsx; frontend/views/genspace/video/OutpaintFrameOverlay.tsx]
