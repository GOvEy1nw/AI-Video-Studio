# #0397 TypeScript target lacks Array.prototype.at used while trimming cleared swatch slots

- 2026-07-29T17:17:21Z `issue`: TypeScript target lacks Array.prototype.at used while trimming cleared swatch slots [frontend/views/genspace/image/RegionPromptEditor.tsx:310]
- 2026-07-29T17:17:25Z `attempt`: Ran strict TypeScript after swatch-slot update; Array.at is unavailable under current configured lib [frontend/views/genspace/image/RegionPromptEditor.tsx:310] (failed)
- 2026-07-29T17:17:46Z `attempt`: Replaced Array.at with indexed last-element access; strict TypeScript passes [frontend/views/genspace/image/RegionPromptEditor.tsx:310] (worked)
- 2026-07-29T17:17:50Z `fix`: Swatch clear compiles under repository TypeScript lib using indexed last-element access [frontend/views/genspace/image/RegionPromptEditor.tsx:310]
