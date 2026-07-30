# #0391 Media crop geometry test used exact floating-point equality for resize deltas

- 2026-07-29T15:20:16Z `issue`: Media crop geometry test used exact floating-point equality for resize deltas [frontend/views/genspace/logic/media-crop.test.ts]
- 2026-07-29T15:20:38Z `attempt`: Changed resize assertions to toBeCloseTo for computed normalized dimensions [frontend/views/genspace/logic/media-crop.test.ts] (worked)
- 2026-07-29T15:20:52Z `fix`: Focused crop geometry suite passes with tolerance-based floating-point assertions [frontend/views/genspace/logic/media-crop.test.ts]
