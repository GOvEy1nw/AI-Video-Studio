# #0029 Restored H3 control_audio or unknown media roles are counted as conflicts but invisible and cannot be removed in Quick Gen.

- 2026-08-12T08:21:26Z `issue`: Restored H3 control_audio or unknown media roles are counted as conflicts but invisible and cannot be removed in Quick Gen. [frontend/views/genspace/video/VideoMediaInputs.tsx]
- 2026-08-12T08:22:09Z `attempt`: Rendered non-addable fallback cards for restored H3 roles, including control_audio, with an always-available remove action and focused coverage. [frontend/views/genspace/video/VideoMediaInputs.tsx] (worked)
- 2026-08-12T08:23:33Z `fix`: Restored H3-only and unknown media roles now render as removable fallback cards, covered by the focused controls test. [frontend/views/genspace/video/VideoMediaInputs.tsx]
