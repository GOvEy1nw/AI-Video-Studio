# #0443 Reframe frame border wiggles and subtly changes aspect while zoom slider moves

- 2026-07-31T11:27:57Z `issue`: Reframe frame border wiggles and subtly changes aspect while zoom slider moves [frontend/views/genspace/video/reframe-outpaint.ts; frontend/views/genspace/components/ReframeEditor.tsx]
- 2026-07-31T11:30:06Z `attempt`: Kept full-precision Reframe padding through UI geometry and moved integer rounding to uncapped Video API serialization [frontend/views/genspace/video/reframe-outpaint.ts; frontend/hooks/generation/request-builders.ts] (partial)
- 2026-07-31T11:32:39Z `attempt`: Verified stable 2:3 frame border at adjacent 50% and 51% zoom steps in native Electron; automated test covers every 0-100 step [frontend/views/genspace/video/reframe-outpaint.ts] (worked)
- 2026-07-31T11:32:42Z `fix`: Removed per-step padding rounding from Reframe editor so zoom no longer oscillates frame aspect [frontend/views/genspace/video/reframe-outpaint.ts]
