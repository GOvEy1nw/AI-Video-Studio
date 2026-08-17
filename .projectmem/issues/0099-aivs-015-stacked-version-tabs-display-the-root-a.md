# #0099 AIVS-015 stacked version tabs display the root asset creation time instead of the selected take time

- 2026-08-17T10:21:46Z `issue`: AIVS-015 stacked version tabs display the root asset creation time instead of the selected take time [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
- 2026-08-17T10:23:17Z `attempt`: Derived selected-generation Created metadata from the active take with root fallback and added a focused assertion [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (partial)
- 2026-08-17T10:23:37Z `attempt`: Focused selected-generation test confirmed the active take creation timestamp is displayed [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-08-17T10:23:40Z `fix`: Selected-generation Created metadata now follows the active stacked take [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
