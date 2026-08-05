# #0632 AIVS-024 playback can start an audio source after stop if AudioContext.resume resolves late, and resume/start failures can leak acquired buffer references.

- 2026-08-05T16:59:20Z `issue`: AIVS-024 playback can start an audio source after stop if AudioContext.resume resolves late, and resume/start failures can leak acquired buffer references. [frontend/views/editor/usePlaybackEngine.ts]
- 2026-08-05T17:01:12Z `attempt`: Made acquired playback buffer exception-safe and token-gated before and after delayed AudioContext.resume; stop now invalidates pending starts. [frontend/views/editor/usePlaybackEngine.ts] (partial)
- 2026-08-05T17:04:53Z `attempt`: Strict TypeScript passes with token-gated resume and exception-safe acquired-buffer release. [frontend/views/editor/usePlaybackEngine.ts] (worked)
- 2026-08-05T17:04:56Z `fix`: Playback pending-start tokens now invalidate on stop and recheck after resume; acquired buffers release unless source ownership transfers. [frontend/views/editor/usePlaybackEngine.ts]
