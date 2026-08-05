# #0641 AIVS-025 Gallery virtualization assumes ResizeObserver exists, breaking jsdom and older renderer environments.

- 2026-08-05T17:21:21Z `issue`: AIVS-025 Gallery virtualization assumes ResizeObserver exists, breaking jsdom and older renderer environments. [frontend/components/GalleryAssetLibrary.tsx:386]
- 2026-08-05T17:21:36Z `attempt`: Added ResizeObserver capability guard and deterministic initial scroll viewport fallback for unmeasured/jsdom surfaces. [frontend/components/GalleryAssetLibrary.tsx] (partial)
- 2026-08-05T17:21:45Z `attempt`: Existing Gallery selection/marquee tests and virtual range tests pass with observer fallback. [frontend/components/GalleryAssetLibrary.test.tsx] (worked)
- 2026-08-05T17:21:48Z `fix`: Gallery virtualization safely falls back when ResizeObserver is unavailable; focused Gallery tests pass. [frontend/components/GalleryAssetLibrary.tsx]
