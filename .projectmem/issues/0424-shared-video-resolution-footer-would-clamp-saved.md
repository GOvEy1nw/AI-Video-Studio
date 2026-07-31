# #0424 Shared Video resolution footer would clamp saved Generate duration while user is in Reframe

- 2026-07-31T10:13:37Z `issue`: Shared Video resolution footer would clamp saved Generate duration while user is in Reframe [frontend/views/genspace/video/VideoGenPanel.tsx]
- 2026-07-31T10:13:50Z `attempt`: Kept Reframe resolution changes from mutating saved Generate duration [frontend/views/genspace/video/VideoGenPanel.tsx] (partial)
- 2026-07-31T10:17:11Z `attempt`: Strict TypeScript passed with Reframe-specific resolution patch behavior [frontend/views/genspace/video/VideoGenPanel.tsx] (worked)
- 2026-07-31T10:17:14Z `fix`: Reframe resolution changes preserve saved Generate duration [frontend/views/genspace/video/VideoGenPanel.tsx]
