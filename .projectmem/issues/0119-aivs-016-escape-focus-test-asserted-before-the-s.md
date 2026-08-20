# #0119 AIVS-016 Escape focus test asserted before the scheduled requestAnimationFrame restored launcher focus.

- 2026-08-19T16:43:05Z `issue`: AIVS-016 Escape focus test asserted before the scheduled requestAnimationFrame restored launcher focus. [frontend/views/genspace/video/VideoModeTabs.test.tsx]
- 2026-08-19T16:43:24Z `attempt`: Waited for the intentional requestAnimationFrame focus restoration before asserting Escape behavior. [frontend/views/genspace/video/VideoModeTabs.test.tsx] (worked)
- 2026-08-19T16:43:24Z `fix`: Escape now has a focused regression check that verifies catalogue closure and launcher focus restoration. [frontend/views/genspace/video/VideoModeTabs.test.tsx]
