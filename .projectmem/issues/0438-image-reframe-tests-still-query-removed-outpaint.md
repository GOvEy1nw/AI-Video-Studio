# #0438 Image Reframe tests still query removed Outpaint expansion label after zoom contract rename

- 2026-07-31T11:01:44Z `issue`: Image Reframe tests still query removed Outpaint expansion label after zoom contract rename [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx]
- 2026-07-31T11:01:47Z `attempt`: Full frontend suite found two stale Image Reframe queries for Outpaint expansion [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx] (failed)
- 2026-07-31T11:02:32Z `attempt`: Updated Image Reframe tests to query Reframe zoom and use 100% for full-fit assertion; focused and full frontend suites pass [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx] (worked)
- 2026-07-31T11:02:36Z `fix`: Image Reframe tests now reflect inverted 0-100 zoom semantics; full frontend suite passes [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx]
