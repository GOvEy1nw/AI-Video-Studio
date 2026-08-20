# #0136 Selected Generation shows requested/stale metadata, reverses A/B sides, and lacks requested video click/loop controls.

- 2026-08-20T16:40:23Z `issue`: Selected Generation shows requested/stale metadata, reverses A/B sides, and lacks requested video click/loop controls. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
- 2026-08-20T16:45:22Z `attempt`: Updated Selected Generation metadata, title, playback loop/click behavior, decoded dimensions, and A/B layer identity; focused verification pending concurrent edits. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (partial)
- 2026-08-20T16:45:30Z `attempt`: AIVS-015 presentation slice: replaced VideoSourceDropZone Browse-card with MediaInputSlot and moved Upscale method into the shared model-card dropdown style. Diff check is clean, but end-to-end TypeScript validation is pending concurrent Selected Generation compile fixes. (partial)
- 2026-08-20T16:45:37Z `attempt`: Focused Selected Generation test passes all four metadata, playback, A/B, and existing interaction cases. [frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-08-20T16:45:42Z `fix`: Selected Generation now uses decoded dimensions, mm:ss timing, take seeds, upscale titles/methods, default looping click playback, and correct A/B sides. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
