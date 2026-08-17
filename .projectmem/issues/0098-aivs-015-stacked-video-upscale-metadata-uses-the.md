# #0098 AIVS-015 stacked video upscale metadata uses the current generation duration default instead of the source asset duration

- 2026-08-17T10:19:00Z `issue`: AIVS-015 stacked video upscale metadata uses the current generation duration default instead of the source asset duration [frontend/views/genspace/logic/generation-assets.ts]
- 2026-08-17T10:24:23Z `attempt`: Carried source video duration through upscale handoff and generated asset construction [frontend/views/genspace/logic/generation-assets.ts] (worked)
- 2026-08-17T10:24:27Z `fix`: Stacked video upscales preserve the source media duration [frontend/views/genspace/logic/generation-assets.ts]
