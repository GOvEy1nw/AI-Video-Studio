# #0125 AIVS-016 focused controls test still expects the removed empty LTX Ref tile; two Cover Song cases also fail from pre-existing empty renders.

- 2026-08-20T11:23:05Z `issue`: AIVS-016 focused controls test still expects the removed empty LTX Ref tile; two Cover Song cases also fail from pre-existing empty renders. [frontend/views/genspace/components/GenSpaceControls.test.tsx]
- 2026-08-20T11:23:45Z `attempt`: Updated the focused LTX controls assertion to the requested Add media entry instead of the removed empty Ref tile; rerun pending. [frontend/views/genspace/components/GenSpaceControls.test.tsx] (partial)
- 2026-08-20T11:24:00Z `attempt`: Focused LTX references test now passes with the Add media assertion: 1 passed, 12 skipped. [frontend/views/genspace/components/GenSpaceControls.test.tsx] (worked)
- 2026-08-20T11:24:06Z `fix`: Aligned the focused LTX controls regression with the new Start/End plus Add media layout; targeted test passes. The two Cover Song failures remain unrelated and pre-existing. [frontend/views/genspace/components/GenSpaceControls.test.tsx]
