# #0636 AIVS-024 disabled VideoThumbnailCard cleanup effect still calls video.load on initial mount without hover.

- 2026-08-05T17:05:18Z `issue`: AIVS-024 disabled VideoThumbnailCard cleanup effect still calls video.load on initial mount without hover. [frontend/views/editor/VideoThumbnailCard.tsx]
- 2026-08-05T17:05:29Z `attempt`: Limited disabled cleanup to active hover state so initially disabled cards never call video.load. [frontend/views/editor/VideoThumbnailCard.tsx] (partial)
- 2026-08-05T17:05:52Z `attempt`: Focused thumbnail lifecycle test passes: initially disabled card does not load media, then disable after hover cleans up. [frontend/views/editor/VideoThumbnailCard.test.tsx] (worked)
- 2026-08-05T17:05:55Z `fix`: Initially disabled VideoThumbnailCard no longer calls video.load; focused lifecycle test passes. [frontend/views/editor/VideoThumbnailCard.tsx]
