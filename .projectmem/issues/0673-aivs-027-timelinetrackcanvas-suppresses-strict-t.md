# #0673 AIVS-027 TimelineTrackCanvas suppresses strict TypeScript with @ts-nocheck after extraction.

- 2026-08-05T19:17:55Z `issue`: AIVS-027 TimelineTrackCanvas suppresses strict TypeScript with @ts-nocheck after extraction. [frontend/views/editor/TimelineTrackCanvas.tsx]
- 2026-08-05T19:21:02Z `attempt`: Replaced suppression with grouped strict props; TypeScript exposed only hovered-cut-point and live-asset nullability mismatches. [frontend/views/editor/TimelineTrackCanvas.tsx] (partial)
- 2026-08-05T19:21:12Z `attempt`: Aligned hovered cut-point and live asset nullability to existing VideoEditor state; strict TypeScript now passes. [frontend/views/editor/TimelineTrackCanvas.tsx] (worked)
- 2026-08-05T19:21:15Z `fix`: TimelineTrackCanvas now has complete grouped strict props and receives its extracted playhead/subtitle dependencies. [frontend/views/editor/TimelineTrackCanvas.tsx]
