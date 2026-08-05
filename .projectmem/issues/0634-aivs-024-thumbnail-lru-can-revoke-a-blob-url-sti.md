# #0634 AIVS-024 thumbnail LRU can revoke a blob URL still held by a mounted image, blanking visible cards during eviction.

- 2026-08-05T16:59:26Z `issue`: AIVS-024 thumbnail LRU can revoke a blob URL still held by a mounted image, blanking visible cards during eviction. [frontend/lib/video-thumbnail-service.ts]
- 2026-08-05T17:02:32Z `attempt`: Added thumbnail entry leases; LRU eviction and cache clear defer blob URL revocation until final hook release. [frontend/lib/video-thumbnail-service.ts] (partial)
- 2026-08-05T17:04:59Z `attempt`: Focused thumbnail tests pass including held-entry eviction and deferred revoke after release. [frontend/lib/video-thumbnail-service.test.ts] (worked)
- 2026-08-05T17:05:02Z `fix`: Thumbnail LRU/clear now defer blob URL revocation for mounted leases; focused lease eviction test passes. [frontend/lib/video-thumbnail-service.ts]
