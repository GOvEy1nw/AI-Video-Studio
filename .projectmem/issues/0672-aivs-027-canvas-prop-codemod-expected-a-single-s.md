# #0672 AIVS-027 canvas-prop codemod expected a single sequence but matching source contains multiple instances.

- 2026-08-05T19:15:12Z `issue`: AIVS-027 canvas-prop codemod expected a single sequence but matching source contains multiple instances. [frontend/views/VideoEditor.tsx]
- 2026-08-05T19:16:08Z `attempt`: Scoped canvas prop replacement to TimelineTrackCanvas call instead of first matching currentTime sequence. [frontend/views/VideoEditor.tsx] (worked)
- 2026-08-05T19:16:08Z `fix`: Canvas props now flow only through TimelineTrackCanvas; TypeScript passes. [frontend/views/VideoEditor.tsx]
