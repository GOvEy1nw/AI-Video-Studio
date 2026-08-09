# #0715 Mode-based active profile fix can mislabel an in-flight generation after the user switches GenSpace modes

- 2026-08-08T19:30:59Z `issue`: Mode-based active profile fix can mislabel an in-flight generation after the user switches GenSpace modes [frontend/views/genspace/logic/active-generation-profile.ts]
- 2026-08-08T19:32:07Z `attempt`: Changed active profile resolution to the newest immutable submission timestamp, with current mode/profile used only before any submission exists [frontend/views/genspace/logic/active-generation-profile.ts] (partial)
- 2026-08-08T19:32:57Z `attempt`: Mode-switch regression test, strict TypeScript, and production renderer/Electron/preload build pass with newest-submission profile resolution [frontend/views/genspace/logic/active-generation-profile.ts] (worked)
- 2026-08-08T19:33:05Z `fix`: Preserved immutable in-flight model labels across GenSpace mode switches by selecting the newest submission snapshot [frontend/views/genspace/logic/active-generation-profile.ts]
