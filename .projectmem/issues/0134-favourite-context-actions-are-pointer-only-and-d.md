# #0134 Favourite context actions are pointer-only and do not focus the portaled menu or return focus, preventing reliable keyboard management.

- 2026-08-20T16:24:00Z `issue`: Favourite context actions are pointer-only and do not focus the portaled menu or return focus, preventing reliable keyboard management. [frontend/views/genspace/GenSpaceModeTabs.tsx]
- 2026-08-20T16:30:34Z `attempt`: Favourites now open the context menu via ContextMenu or Shift+F10, focus menu items, support menu-key navigation, and restore focus after Escape/actions. [frontend/views/genspace/GenSpaceModeTabs.tsx] (worked)
- 2026-08-20T16:32:23Z `fix`: Favourite context actions now support keyboard opening, menu navigation, Escape, and focus return; focused regression and re-review pass. [frontend/views/genspace/GenSpaceModeTabs.tsx]
