# #0343 Selected-generation progress test finds status text twice after header now mirrors current generation status

- 2026-07-28T10:52:52Z `issue`: Selected-generation progress test finds status text twice after header now mirrors current generation status [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx]
- 2026-07-28T10:53:05Z `attempt`: Kept active-generation header generic while selected assets use prompt title, avoiding duplicate status text [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (partial)
- 2026-07-28T10:53:19Z `attempt`: Reran three focused GenSpace/Asset Library files; all 6 tests passed [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-07-28T10:53:23Z `fix`: Active-generation status remains in progress body while selected asset prompt alone replaces center header title [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
