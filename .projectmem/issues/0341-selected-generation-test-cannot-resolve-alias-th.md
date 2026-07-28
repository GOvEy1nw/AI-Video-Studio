# #0341 Selected-generation test cannot resolve @ alias through imported DownloadProgressView under focused Vitest invocation

- 2026-07-28T10:28:34Z `issue`: Selected-generation test cannot resolve @ alias through imported DownloadProgressView under focused Vitest invocation [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx]
- 2026-07-28T10:28:56Z `attempt`: Mocked DownloadProgressView in selected-generation component test to isolate panel behavior from unrelated alias import [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (partial)
- 2026-07-28T10:29:15Z `attempt`: Focused selected-generation and gallery tests pass after isolating DownloadProgressView [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-07-28T10:29:19Z `fix`: Selected-generation test now isolates transfer UI and passes with the focused GenSpace suite [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx]
