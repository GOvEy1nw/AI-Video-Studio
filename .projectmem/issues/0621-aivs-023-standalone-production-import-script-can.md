# #0621 AIVS-023 standalone production import script cannot load built module because current Electron build emits only main.js.

- 2026-08-05T16:16:47Z `issue`: AIVS-023 standalone production import script cannot load built module because current Electron build emits only main.js. [scripts/test-project-asset-import.mjs]
- 2026-08-05T16:18:51Z `attempt`: Standalone test now compiles project-asset-import.ts with Vite SSR production build into an isolated temp directory, then loads only that artifact. [scripts/test-project-asset-import.mjs] (worked)
- 2026-08-05T16:18:57Z `fix`: Standalone import verification builds and executes the real production asset-import module; no source fallback or unavailable dist assumption remains. [scripts/test-project-asset-import.mjs]
