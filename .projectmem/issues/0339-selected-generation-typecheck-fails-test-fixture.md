# #0339 Selected-generation typecheck fails: test fixture lacks new generation fields and ES target rejects String.replaceAll

- 2026-07-28T10:25:56Z `issue`: Selected-generation typecheck fails: test fixture lacks new generation fields and ES target rejects String.replaceAll [frontend/views/genspace/GenSpaceGallery.test.tsx; frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-07-28T10:26:12Z `attempt`: Added generation fixture fields and replaced unsupported replaceAll calls with ES-target-compatible split/join [frontend/views/genspace/GenSpaceGallery.test.tsx; frontend/views/genspace/hooks/useGenSpaceController.tsx] (partial)
- 2026-07-28T10:26:29Z `attempt`: TypeScript now passes after fixture and ES-target compatibility corrections [frontend/views/genspace/GenSpaceGallery.test.tsx; frontend/views/genspace/hooks/useGenSpaceController.tsx] (worked)
- 2026-07-28T10:26:37Z `fix`: Typecheck compatibility restored for selected-generation generation contract and model fallback formatting [frontend/views/genspace/GenSpaceGallery.test.tsx; frontend/views/genspace/hooks/useGenSpaceController.tsx]
