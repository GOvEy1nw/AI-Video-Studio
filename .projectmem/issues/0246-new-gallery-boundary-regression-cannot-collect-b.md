# #0246 New gallery boundary regression cannot collect because GenSpaceGallery imports DownloadProgressView with unresolved @ alias in focused Vitest

- 2026-07-27T08:50:10Z `issue`: New gallery boundary regression cannot collect because GenSpaceGallery imports DownloadProgressView with unresolved @ alias in focused Vitest [frontend/views/genspace/GenSpaceGallery.test.tsx]
- 2026-07-27T08:50:28Z `attempt`: Mocked DownloadProgressView and GalleryAssetLibrary runtime modules so focused boundary test can collect without unrelated @ alias imports. [frontend/views/genspace/GenSpaceGallery.test.tsx] (partial)
- 2026-07-27T08:50:43Z `attempt`: Focused gallery boundary test now collects and passes: 1 file, 1 test. [frontend/views/genspace/GenSpaceGallery.test.tsx] (worked)
- 2026-07-27T08:50:47Z `fix`: Isolated gallery geometry test from unrelated heavy component imports with focused module mocks. [frontend/views/genspace/GenSpaceGallery.test.tsx]
