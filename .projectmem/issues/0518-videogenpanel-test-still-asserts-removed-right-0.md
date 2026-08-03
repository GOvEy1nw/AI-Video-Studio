# #0518 VideoGenPanel test still asserts removed right-0 class on migrated aspect-ratio FloatingMenu

- 2026-08-03T14:41:31Z `issue`: VideoGenPanel test still asserts removed right-0 class on migrated aspect-ratio FloatingMenu [frontend/views/genspace/video/VideoGenPanel.test.tsx]
- 2026-08-03T14:42:14Z `attempt`: Replaced VideoGenPanel local-positioning assertion with bottom-end portal contract checks [frontend/views/genspace/video/VideoGenPanel.test.tsx] (partial)
- 2026-08-03T14:42:25Z `attempt`: Targeted VideoGenPanel migrated menu assertion passes [frontend/views/genspace/video/VideoGenPanel.test.tsx] (worked)
- 2026-08-03T14:42:28Z `fix`: VideoGenPanel now tests bottom-end FloatingMenu placement and body portal behavior [frontend/views/genspace/video/VideoGenPanel.test.tsx]
