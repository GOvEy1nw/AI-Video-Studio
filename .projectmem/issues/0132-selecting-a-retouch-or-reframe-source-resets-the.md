# #0132 Selecting a Retouch or Reframe source resets the active image edit tool back to plain Edit before the requested workflow can run.

- 2026-08-20T16:23:50Z `issue`: Selecting a Retouch or Reframe source resets the active image edit tool back to plain Edit before the requested workflow can run. [frontend/views/genspace/image/ImageEditMediaInputs.tsx]
- 2026-08-20T16:30:23Z `attempt`: Source assignment now clears only stale mask/outpaint recipes and preserves the selected Retouch/Reframe tool; focused regression passes. [frontend/views/genspace/image/ImageEditMediaInputs.tsx] (worked)
- 2026-08-20T16:32:10Z `fix`: Retouch/Reframe remain selected when a source is assigned; focused regression, typecheck, build, and re-review pass. [frontend/views/genspace/image/ImageEditMediaInputs.tsx]
