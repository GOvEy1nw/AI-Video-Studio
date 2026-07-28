# #0245 GenSpace gallery OS-drop target geometry extends behind left generation sidebar and competes with media input dropzones

- 2026-07-27T08:46:16Z `issue`: GenSpace gallery OS-drop target geometry extends behind left generation sidebar and competes with media input dropzones [frontend/views/genspace/GenSpaceGallery.tsx]
- 2026-07-27T08:49:14Z `attempt`: Moved OS-drop handlers from workspace root onto a gallery-only pane starting at 480px; reverted sidebar child propagation workaround and added boundary regression test. [frontend/views/genspace/GenSpaceGallery.tsx] (partial)
- 2026-07-27T08:52:43Z `attempt`: Gallery boundary regression and full frontend suite pass: 22 files, 65 tests; strict TypeScript and diff check also pass. [frontend/views/genspace] (worked)
- 2026-07-27T08:53:02Z `attempt`: Production renderer, Electron main, and preload bundles pass after gallery pane drop-zone fix. [frontend/views/genspace] (worked)
- 2026-07-27T08:56:05Z `fix`: Moved gallery drag handlers and overlay into right-hand gallery pane; user confirmed drag-input now works without gallery interception. [frontend/views/genspace]
