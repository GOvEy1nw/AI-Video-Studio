# #0511 FloatingMenu flipAlign returns template string wider than placement union under strict TypeScript

- 2026-08-03T14:15:24Z `issue`: FloatingMenu flipAlign returns template string wider than placement union under strict TypeScript [frontend/components/FloatingMenu.tsx:48]
- 2026-08-03T14:15:29Z `attempt`: Strict TypeScript found one new flipAlign return-type error plus 12 known unrelated unused-symbol diagnostics [frontend/components/FloatingMenu.tsx:48] (failed)
- 2026-08-03T14:15:49Z `attempt`: Replaced dynamic template construction with exhaustive placement flip maps [frontend/components/FloatingMenu.tsx:32] (partial)
- 2026-08-03T14:16:21Z `attempt`: Strict TypeScript no longer reports FloatingMenu diagnostics; only 13 known unrelated unused-symbol errors remain [frontend/components/FloatingMenu.tsx] (worked)
- 2026-08-03T14:16:24Z `fix`: Exhaustive placement maps satisfy strict FloatingMenu union typing [frontend/components/FloatingMenu.tsx]
