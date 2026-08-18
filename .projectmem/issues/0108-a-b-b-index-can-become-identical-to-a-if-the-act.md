# #0108 A/B B-index can become identical to A if the active take changes outside the version-tab click path, violating the active-A/other-B invariant.

- 2026-08-17T13:20:30Z `issue`: A/B B-index can become identical to A if the active take changes outside the version-tab click path, violating the active-A/other-B invariant. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
- 2026-08-17T13:21:42Z `attempt`: Reset optional comparison B whenever asset ID or activeTakeIndex changes, with focused rerender coverage. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (worked)
- 2026-08-17T13:22:43Z `fix`: A/B comparison now clears on external active-take changes, preserving the active-A/other-B invariant; focused viewer tests and TypeScript pass. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
