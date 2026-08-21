# #0165 A queue admission failure can leave an editor clip marked as regenerating and surface as an unhandled rejected promise.

- 2026-08-20T22:29:23Z `issue`: A queue admission failure can leave an editor clip marked as regenerating and surface as an unhandled rejected promise. [frontend/views/editor/useRegeneration.ts]
- 2026-08-20T22:33:58Z `attempt`: Queue admission is caught and regeneration IDs plus clip marker are cleared in finally; focused hook test passes. [frontend/views/editor/useRegeneration.ts] (worked)
- 2026-08-20T22:34:04Z `fix`: Editor regeneration admission failures no longer leave clips stuck or reject unhandled; focused test passes. [frontend/views/editor/useRegeneration.ts]
