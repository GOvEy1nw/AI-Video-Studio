# #0007 Guide trim regressed: duration remains zero so timeline hides, and preview still appears left aligned

- 2026-07-09T20:12:38Z `issue`: Guide trim regressed: duration remains zero so timeline hides, and preview still appears left aligned [frontend/views/GenSpace.tsx; frontend/components/VideoTrimPanel.tsx]
- 2026-07-09T20:13:07Z `attempt`: Combined duration and centering patch did not apply because current class text differed; no files changed [frontend/views/GenSpace.tsx] (failed)
- 2026-07-09T20:14:06Z `attempt`: Guide trim now probes ready media immediately and via metadata/duration/canplay events; video uses centered intrinsic width; TypeScript and 51 focused tests pass [frontend/views/GenSpace.tsx] (worked)
- 2026-07-09T20:14:10Z `fix`: Fixed guide trim duration regression and centered video frame sizing [frontend/views/GenSpace.tsx]
