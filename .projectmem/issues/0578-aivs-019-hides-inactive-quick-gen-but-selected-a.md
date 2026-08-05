# #0578 AIVS-019 hides inactive Quick Gen but selected audio/video preview receives no isActive signal, so hidden media can continue playback after tab switch.

- 2026-08-05T10:49:27Z `issue`: AIVS-019 hides inactive Quick Gen but selected audio/video preview receives no isActive signal, so hidden media can continue playback after tab switch. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
- 2026-08-05T10:52:14Z `attempt`: Propagated workspace activity to selected preview; inactive media pauses and ignores Space transport; replaced helper test with focused pause regression. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (partial)
- 2026-08-05T10:52:28Z `attempt`: Focused regression test failed before execution because this Vitest environment does not provide afterEach named import. [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (failed)
- 2026-08-05T10:52:40Z `attempt`: Removed unavailable afterEach import; test has one local media spy scenario. [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (partial)
- 2026-08-05T10:52:58Z `attempt`: Stubbed jsdom pause implementation to keep focused playback regression output clean. [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (partial)
- 2026-08-05T10:53:12Z `attempt`: Focused selected-media regression passes: active playback begins and inactive rerender pauses it. [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-08-05T10:53:16Z `fix`: Inactive GenSpace now pauses selected audio/video and disables its scoped Space transport while preserving mounted generation state. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
