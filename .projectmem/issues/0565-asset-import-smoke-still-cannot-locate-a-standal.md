# #0565 Asset-import smoke still cannot locate a standalone module after successful production build because Vite bundles helper into main.js

- 2026-08-05T09:29:46Z `issue`: Asset-import smoke still cannot locate a standalone module after successful production build because Vite bundles helper into main.js [scripts/test-project-asset-import.mjs / dist-electron]
- 2026-08-05T09:30:32Z `attempt`: Clarified failure requires a standalone production module artifact; script still exits 1 after normal bundle build and never tests fallback code [scripts/test-project-asset-import.mjs / dist-electron] (partial)
- 2026-08-05T09:30:41Z `fix`: Standalone asset-import smoke now fails explicitly when no separately built module artifact exists and cannot report fallback success [scripts/test-project-asset-import.mjs]
