# #0436 Reframe control prop was attached to Create ImageMediaInputs instead of ImageEditMediaInputs

- 2026-07-31T11:00:02Z `issue`: Reframe control prop was attached to Create ImageMediaInputs instead of ImageEditMediaInputs [frontend/views/genspace/image/ImageGenPanel.tsx]
- 2026-07-31T11:00:05Z `attempt`: Strict TypeScript identified misplaced reframeControls prop on Create ImageMediaInputs [frontend/views/genspace/image/ImageGenPanel.tsx] (failed)
- 2026-07-31T11:00:30Z `attempt`: Moved reframeControls prop to ImageEditMediaInputs; strict TypeScript passes [frontend/views/genspace/image/ImageGenPanel.tsx] (worked)
- 2026-07-31T11:00:35Z `fix`: Image Reframe controls now pass through ImageEditMediaInputs only [frontend/views/genspace/image/ImageGenPanel.tsx]
