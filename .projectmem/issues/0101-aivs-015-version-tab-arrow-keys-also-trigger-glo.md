# #0101 AIVS-015 version-tab arrow keys also trigger global gallery previous/next navigation

- 2026-08-17T10:27:26Z `issue`: AIVS-015 version-tab arrow keys also trigger global gallery previous/next navigation [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
- 2026-08-17T10:27:45Z `attempt`: Stopped version-tab arrow event propagation and asserted it does not reach the window gallery handler [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (partial)
- 2026-08-17T10:28:07Z `attempt`: Focused selected-generation test and TypeScript check confirmed tab arrows no longer escape to window navigation [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-08-17T10:28:11Z `fix`: Version-tab arrow navigation is isolated from global gallery asset shortcuts [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
