# #0638 AIVS-024 VideoThumbnailCard starts shared thumbnail decode for offscreen take cards because workspace enabled is not combined with card visibility.

- 2026-08-05T17:08:49Z `issue`: AIVS-024 VideoThumbnailCard starts shared thumbnail decode for offscreen take cards because workspace enabled is not combined with card visibility. [frontend/views/editor/VideoThumbnailCard.tsx]
- 2026-08-05T17:09:34Z `attempt`: Added card-local IntersectionObserver and pass enabled && visible to shared thumbnail acquisition; persisted fallback skips observer/decode. [frontend/views/editor/VideoThumbnailCard.tsx] (partial)
- 2026-08-05T17:10:04Z `attempt`: Focused thumbnail tests pass: shared thumbnail request remains disabled until card intersection, then activates. [frontend/views/editor/VideoThumbnailCard.test.tsx] (worked)
- 2026-08-05T17:10:10Z `fix`: VideoThumbnailCard acquires generated thumbnails only while enabled and intersecting; focused visibility test passes. [frontend/views/editor/VideoThumbnailCard.tsx]
