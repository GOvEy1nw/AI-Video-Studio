# #0468 LoRA-backed Video Tools reject selected source with 'You must provide a Source Video file to continue'

- 2026-08-02T10:32:21Z `issue`: LoRA-backed Video Tools reject selected source with 'You must provide a Source Video file to continue' [frontend/hooks/generation/request-builders.ts]
- 2026-08-02T10:37:09Z `fix`: Tool source inputs now preserve native paths alongside display URLs and request compilation prefers that path, so Asset Library sources serialize as control_video [frontend/views/genspace/video/VideoToolInput.tsx]
