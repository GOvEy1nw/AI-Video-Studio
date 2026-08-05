# #0635 AIVS-024 useVideoThumbnail retains stale thumbnail state when URL, fallback, or enabled state changes.

- 2026-08-05T16:59:29Z `issue`: AIVS-024 useVideoThumbnail retains stale thumbnail state when URL, fallback, or enabled state changes. [frontend/lib/video-thumbnail-service.ts]
- 2026-08-05T17:02:35Z `attempt`: Keyed thumbnail hook state by URL variant and resets/releases on fallback or enabled transitions to avoid stale image URLs. [frontend/lib/video-thumbnail-service.ts] (partial)
- 2026-08-05T17:04:08Z `attempt`: Focused transition test failed to parse because .test.ts cannot contain JSX. [frontend/lib/video-thumbnail-service.test.ts:97] (failed)
- 2026-08-05T17:04:18Z `attempt`: Rewrote hook transition test with createElement so it remains valid in .test.ts. [frontend/lib/video-thumbnail-service.test.ts] (partial)
- 2026-08-05T17:04:27Z `attempt`: Transition test ran but this Vitest setup lacks jest-dom matcher toHaveTextContent. [frontend/lib/video-thumbnail-service.test.ts:101] (failed)
- 2026-08-05T17:04:35Z `attempt`: Changed transition assertions to standard textContent checks supported by this test setup. [frontend/lib/video-thumbnail-service.test.ts] (partial)
- 2026-08-05T17:05:05Z `attempt`: Focused hook transition test passes; previous URL is not returned when URL changes while disabled. [frontend/lib/video-thumbnail-service.test.ts] (worked)
- 2026-08-05T17:05:08Z `fix`: Thumbnail hook state is variant-keyed and releases leases on transitions, preventing stale URLs; focused transition test passes. [frontend/lib/video-thumbnail-service.ts]
