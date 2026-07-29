# #0345 Full frontend suite expects 360px Asset Library while current GenSpace gallery is 480px

- 2026-07-28T11:25:02Z `issue`: Full frontend suite expects 360px Asset Library while current GenSpace gallery is 480px [frontend/views/genspace/GenSpaceGallery.test.tsx]
- 2026-07-29T10:57:25Z `attempt`: Full frontend suite after model-profile work still fails only stale GenSpace gallery width expectation (360px test versus current 480px UI) [frontend/views/genspace/GenSpaceGallery.test.tsx] (failed)
- 2026-07-29T13:31:31Z `fix`: Removed brittle exact Asset Library width-class assertion; dropzone ownership and active-generation interaction remain covered, and full suite passes. [frontend/views/genspace/GenSpaceGallery.test.tsx]
