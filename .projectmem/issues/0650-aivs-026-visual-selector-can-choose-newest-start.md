# #0650 AIVS-026 visual selector can choose newest start instead of later original-array clip for overlapping same-track intervals.

- 2026-08-05T17:58:29Z `issue`: AIVS-026 visual selector can choose newest start instead of later original-array clip for overlapping same-track intervals. [frontend/views/editor/playback-index.ts]
- 2026-08-05T17:59:49Z `attempt`: Replaced per-track backward scans with material-time interval segments that preserve later original-array overlap precedence. [frontend/views/editor/playback-index.ts] (partial)
- 2026-08-05T18:00:27Z `fix`: Interval-segment selector preserves same-track original-array precedence; focused tests pass. [frontend/views/editor/playback-index.ts]
