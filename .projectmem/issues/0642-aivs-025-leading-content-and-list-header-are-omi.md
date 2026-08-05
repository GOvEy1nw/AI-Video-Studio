# #0642 AIVS-025 leading content and list header are omitted from virtual scroll coordinates, causing asset rows to disappear after scrolling.

- 2026-08-05T17:26:10Z `issue`: AIVS-025 leading content and list header are omitted from virtual scroll coordinates, causing asset rows to disappear after scrolling. [frontend/components/GalleryAssetLibrary.tsx; frontend/components/GalleryAssetList.tsx]
- 2026-08-05T17:28:30Z `attempt`: Restored grid/list leading-content layout and derive virtual scroll offset from each virtual asset body. [frontend/components/GalleryAssetLibrary.tsx; frontend/components/GalleryAssetList.tsx] (partial)
- 2026-08-05T17:29:26Z `fix`: Leading content retains grid/list layout and virtual ranges now use scroll position relative to each asset body; focused Gallery tests pass. [frontend/components/GalleryAssetLibrary.tsx; frontend/components/GalleryAssetList.tsx]
