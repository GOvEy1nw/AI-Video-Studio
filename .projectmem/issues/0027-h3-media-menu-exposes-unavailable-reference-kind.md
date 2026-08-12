# #0027 H3 @ media menu exposes unavailable reference kinds and remains active in panel modes where its picker owner is unmounted.

- 2026-08-11T17:46:32Z `issue`: H3 @ media menu exposes unavailable reference kinds and remains active in panel modes where its picker owner is unmounted. [frontend/views/genspace/video/VideoGenPanel.tsx]
- 2026-08-11T17:50:02Z `attempt`: Added shared per-kind H3 reference availability, scoped mentions to normal H3 generation, cleared stale picker ownership, and corrected video thumbnails/ARIA. [frontend/views/genspace/video/VideoGenPanel.tsx] (worked)
- 2026-08-11T17:51:03Z `fix`: H3 prompt/add-media actions now share per-kind availability, are normal-generation-only, clear stale picker ownership, and pass focused UI/logic tests. [frontend/views/genspace/video/VideoGenPanel.tsx]
