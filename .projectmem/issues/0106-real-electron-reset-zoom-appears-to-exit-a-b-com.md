# #0106 Real Electron Reset Zoom appears to exit A/B comparison after compare zoom/pan, removing divider and comparison labels.

- 2026-08-17T12:54:55Z `issue`: Real Electron Reset Zoom appears to exit A/B comparison after compare zoom/pan, removing divider and comparison labels. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
- 2026-08-17T12:57:18Z `attempt`: Added a compare-mode Reset Zoom regression that asserts the divider and A/B tab selections remain while transform resets. [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-08-17T12:57:25Z `fix`: Focused regression confirms Reset Zoom preserves A/B mode and labels; the earlier visual observation was inconclusive after shared desktop focus changed. [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx]
