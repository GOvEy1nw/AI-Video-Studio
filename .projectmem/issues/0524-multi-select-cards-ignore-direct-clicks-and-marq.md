# #0524 Multi-select cards ignore direct clicks, and marquee dragging triggers native browser text selection.

- 2026-08-03T15:56:24Z `issue`: Multi-select cards ignore direct clicks, and marquee dragging triggers native browser text selection. [frontend/components/GalleryAssetLibrary.tsx]
- 2026-08-03T15:58:50Z `attempt`: Added pointer-click capture and selectstart regression tests; current handlers fail both as expected. Focused suite also retains three pre-existing GalleryAssetLibrary failures. [frontend/components/GalleryAssetLibrary.tsx] (failed)
- 2026-08-03T15:59:50Z `attempt`: Moved pointer capture to first drag-threshold move, added native selectstart prevention, inline userSelect none, and cleared ranges during marquee; both feedback regressions pass. [frontend/components/GalleryAssetLibrary.tsx] (worked)
- 2026-08-03T16:01:21Z `fix`: GalleryAssetLibrary now leaves pointer clicks uncaptured until drag threshold, prevents selectstart/native highlighting in multi-select mode, and clears ranges during marquee; regression tests and production build pass. [frontend/components/GalleryAssetLibrary.tsx]
