# #0370 Framing carousel drag snaps abruptly and mouse wheel does not scroll horizontal or vertical selectors

- 2026-07-29T12:39:55Z `issue`: Framing carousel drag snaps abruptly and mouse wheel does not scroll horizontal or vertical selectors [frontend/views/genspace/components/FramingControl.tsx]
- 2026-07-29T12:40:44Z `attempt`: Added regressions for deferred drag selection and wheel input; current implementation fails both as expected [frontend/views/genspace/components/FramingControl.test.tsx] (failed)
- 2026-07-29T12:43:39Z `attempt`: Changed framing wheels to continuous pointer scrolling with release snapping and added accumulated mouse-wheel scrolling for horizontal and vertical selectors; focused 5-test suite passes. [frontend/views/genspace/components/FramingControl.tsx] (worked)
- 2026-07-29T12:47:35Z `fix`: Implemented continuous drag/wheel scrolling with smooth nearest-option snapping; focused tests, TypeScript check, and frontend build pass, with full suite unchanged at three unrelated baseline failures. [frontend/views/genspace/components/FramingControl.tsx; frontend/views/genspace/components/FramingControl.test.tsx]
