# #0654 AIVS-026 terminal rAF state publish does not update equivalence ref before cleanup, causing duplicate current-time dispatch.

- 2026-08-05T18:04:19Z `issue`: AIVS-026 terminal rAF state publish does not update equivalence ref before cleanup, causing duplicate current-time dispatch. [frontend/views/editor/usePlaybackEngine.ts:252]
- 2026-08-05T18:05:00Z `attempt`: Synchronised terminal rAF time publish with equivalence ref before cleanup. [frontend/views/editor/usePlaybackEngine.ts] (partial)
- 2026-08-05T18:05:19Z `fix`: Terminal playback time updates equivalence ref before cleanup, avoiding duplicate state dispatch. [frontend/views/editor/usePlaybackEngine.ts]
