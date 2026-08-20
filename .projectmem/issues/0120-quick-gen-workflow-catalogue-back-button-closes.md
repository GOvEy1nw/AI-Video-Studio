# #0120 Quick Gen workflow catalogue back button closes without restoring focus to its launcher

- 2026-08-19T16:55:49Z `issue`: Quick Gen workflow catalogue back button closes without restoring focus to its launcher [frontend/views/genspace/components/ModeSelector.tsx]
- 2026-08-19T16:56:11Z `attempt`: Restored launcher focus after closing the workflow catalogue with its back button [frontend/views/genspace/components/ModeSelector.tsx] (worked)
- 2026-08-19T16:59:11Z `attempt`: Added focused coverage for back-button and Escape focus restoration in the workflow catalogue [frontend/views/genspace/video/VideoModeTabs.test.tsx] (worked)
- 2026-08-19T16:59:41Z `fix`: Workflow catalogue back button now closes and restores focus, covered alongside Escape behavior [frontend/views/genspace/components/ModeSelector.tsx]
