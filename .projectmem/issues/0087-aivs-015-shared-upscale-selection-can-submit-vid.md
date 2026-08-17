# #0087 AIVS-015 shared Upscale selection can submit video-only LTX from Image mode after a mode switch, and SubmittedVideoToolId still admits upscale.

- 2026-08-16T19:28:58Z `issue`: AIVS-015 shared Upscale selection can submit video-only LTX from Image mode after a mode switch, and SubmittedVideoToolId still admits upscale. [frontend/views/genspace/hooks/useGenSpaceUpscaleState.ts]
- 2026-08-16T19:32:25Z `attempt`: Derived one effective selection per media kind for UI/submission/snapshot parity and excluded upscale from SubmittedVideoToolId; 17 focused frontend tests and TS typecheck passed. [frontend/views/genspace/hooks/useGenSpaceUpscaleState.ts] (worked)
- 2026-08-16T19:32:36Z `fix`: Image and Video Upscale now share only kind-compatible effective selections, and generative video tool requests cannot accept upscale. [frontend/views/genspace/hooks/useGenSpaceUpscaleState.ts]
