# #0601 AIVS-021 VideoEditor can render stale active timeline because getActiveTimeline reads projectsRef updated in passive effect

- 2026-08-05T14:09:11Z `issue`: AIVS-021 VideoEditor can render stale active timeline because getActiveTimeline reads projectsRef updated in passive effect [frontend/views/VideoEditor.tsx]
- 2026-08-05T14:09:48Z `attempt`: Derived VideoEditor active timeline from reactive timelines/activeTimelineId slice and added provider probe for active ID updates [frontend/views/VideoEditor.tsx] (worked)
- 2026-08-05T14:10:14Z `fix`: Reactive active-timeline derivation confirmed by new provider assertion, 163 frontend tests, TypeScript, and production build [frontend/views/VideoEditor.tsx]
