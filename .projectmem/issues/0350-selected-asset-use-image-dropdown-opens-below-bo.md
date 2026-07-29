# #0350 Selected-asset Use image dropdown opens below bottom toolbar and clips First/Last Frame options

- 2026-07-28T12:36:45Z `issue`: Selected-asset Use image dropdown opens below bottom toolbar and clips First/Last Frame options [frontend/components/UseImageDropdown.tsx]
- 2026-07-28T12:36:57Z `attempt`: Changed detail Use image menu placement to open above the bottom action toolbar [frontend/components/UseImageDropdown.tsx] (partial)
- 2026-07-28T12:41:01Z `attempt`: Opened detail dropdown upward and card dropdown leftward; selected-asset menu no longer clips in Electron, and post-patch TypeScript/build/diff checks pass [frontend/components/UseImageDropdown.tsx] (worked)
- 2026-07-28T12:41:04Z `fix`: Use image menus use context-specific upward/leftward placement so selected and card actions stay visible within their containers [frontend/components/UseImageDropdown.tsx]
