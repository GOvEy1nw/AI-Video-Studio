# #0094 AIVS-015 follow-up normal pnpm dev Electron smoke stalls before backend/UI readiness, blocking inspection of the new Upscale controls

- 2026-08-17T08:25:22Z `issue`: AIVS-015 follow-up normal pnpm dev Electron smoke stalls before backend/UI readiness, blocking inspection of the new Upscale controls [visual QA / pnpm dev]
- 2026-08-17T08:25:28Z `attempt`: Launched one clean normal pnpm dev Electron instance; bundles loaded but backend/UI readiness never became inspectable after about two minutes [visual QA / pnpm dev] (failed)
- 2026-08-17T08:27:27Z `attempt`: Tried the built Electron helper fallback; dev/unpacked detection still targeted localhost:5173 and failed ERR_CONNECTION_REFUSED without the dev server [visual QA / electron helper] (failed)
- 2026-08-17T08:33:48Z `attempt`: Used the supported dev:debug Electron path for renderer-only QA; Quick Gen became inspectable and keyboard/menu/slider interactions passed [visual QA / pnpm dev:debug] (worked)
- 2026-08-17T08:33:54Z `fix`: Real-Electron dev:debug inspection confirmed the new Upscale menu and slider UI; normal dev readiness stall remains an environment-specific launch limitation [visual QA / pnpm dev:debug]
