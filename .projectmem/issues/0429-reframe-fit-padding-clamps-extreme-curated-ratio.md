# #0429 Reframe fit padding clamps extreme curated ratios to 100%, so 16:9 input cannot reach 9:21 or 9:16 target geometry

- 2026-07-31T10:42:48Z `issue`: Reframe fit padding clamps extreme curated ratios to 100%, so 16:9 input cannot reach 9:21 or 9:16 target geometry [frontend/views/genspace/video/reframe-outpaint.ts]
- 2026-07-31T10:57:48Z `attempt`: Focused Reframe tests exercised new 50-100% scale; implementation geometry passed structurally, but assertions assumed JSON key order and tighter precision than integer percentage padding permits [frontend/views/genspace/components/ReframeEditor.test.tsx; frontend/views/genspace/video/reframe-outpaint.test.ts] (partial)
- 2026-07-31T11:24:00Z `fix`: Extreme curated Reframe ratios now compute uncapped fit and half-scale padding; geometry test passes [frontend/views/genspace/video/reframe-outpaint.ts]
