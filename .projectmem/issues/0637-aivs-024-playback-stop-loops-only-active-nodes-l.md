# #0637 AIVS-024 playback stop loops only active nodes, leaving pending audio start tokens valid across stop cleanup.

- 2026-08-05T17:06:17Z `issue`: AIVS-024 playback stop loops only active nodes, leaving pending audio start tokens valid across stop cleanup. [frontend/views/editor/usePlaybackEngine.ts:672]
- 2026-08-05T17:06:25Z `attempt`: Cleared pending audio-start tokens in playback cleanup and non-playing scrub cleanup, including when no node exists. [frontend/views/editor/usePlaybackEngine.ts] (partial)
- 2026-08-05T17:06:36Z `attempt`: Strict TypeScript passes after stop cleanup clears pending audio start tokens. [frontend/views/editor/usePlaybackEngine.ts] (worked)
- 2026-08-05T17:06:42Z `fix`: All playback stop paths clear pending tokens, preventing a delayed resume from starting stale audio. [frontend/views/editor/usePlaybackEngine.ts]
