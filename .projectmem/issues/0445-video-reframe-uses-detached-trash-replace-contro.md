# #0445 Video Reframe uses detached trash/replace controls and lacks Image Reframe header, overlay close affordance, and aligned panel spacing

- 2026-07-31T11:49:50Z `issue`: Video Reframe uses detached trash/replace controls and lacks Image Reframe header, overlay close affordance, and aligned panel spacing [frontend/views/genspace/video/ReframePanel.tsx]
- 2026-07-31T11:51:16Z `attempt`: Moved Video Reframe output controls into shared labeled header, removed detached Replace/trash row, added canvas-overlay X, and aligned canvas/transport spacing [frontend/views/genspace/video/ReframePanel.tsx] (partial)
- 2026-07-31T11:52:36Z `attempt`: Focused and full frontend tests, strict TypeScript, production build, diff check, and user visual review passed [frontend/views/genspace/video/ReframePanel.tsx] (worked)
- 2026-07-31T11:52:40Z `fix`: Video Reframe now mirrors Image Reframe control composition with shared header controls, overlay X removal, no Replace action, and aligned spacing [frontend/views/genspace/video/ReframePanel.tsx]
