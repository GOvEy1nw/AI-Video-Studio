# #0005 Normal guide trim duration path should mirror Retake/Reframe local videoRef state instead of parent mediaDuration synchronization

- 2026-07-09T20:01:49Z `issue`: Normal guide trim duration path should mirror Retake/Reframe local videoRef state instead of parent mediaDuration synchronization [frontend/views/GenSpace.tsx]
- 2026-07-09T20:02:53Z `attempt`: Replaced parent-driven duration probe with Retake/Reframe local videoDuration state and loadedmetadata ref listener; TypeScript and focused tests pass [frontend/views/GenSpace.tsx] (worked)
- 2026-07-09T20:02:58Z `fix`: Normal guide trim now mirrors Retake/Reframe duration ownership and loadedmetadata handling exactly [frontend/views/GenSpace.tsx]
