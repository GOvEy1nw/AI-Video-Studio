# #0665 AIVS-027 deleting TimelineTrackRow left unused MouseEventHandler import under strict TypeScript.

- 2026-08-05T18:40:11Z `issue`: AIVS-027 deleting TimelineTrackRow left unused MouseEventHandler import under strict TypeScript. [frontend/views/editor/timeline/TimelinePrimitives.tsx]
- 2026-08-05T18:40:28Z `attempt`: Removed now-unused TimelinePrimitives MouseEventHandler import; strict TypeScript passes. [frontend/views/editor/timeline/TimelinePrimitives.tsx] (worked)
- 2026-08-05T18:40:28Z `fix`: Timeline primitive imports match the retained component set after dead-row deletion. [frontend/views/editor/timeline/TimelinePrimitives.tsx]
