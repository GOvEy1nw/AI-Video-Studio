# #0133 Favourite reorder Done exits before the debounced app-settings write is guaranteed, so an immediate close can lose the confirmed order.

- 2026-08-20T16:23:55Z `issue`: Favourite reorder Done exits before the debounced app-settings write is guaranteed, so an immediate close can lose the confirmed order. [frontend/views/genspace/GenSpaceModeTabs.tsx]
- 2026-08-20T16:30:29Z `attempt`: Done now awaits controller confirmFavouriteOrder, which saves normalized current IDs through immediate AppSettings saveSettings and stays active on rejection. [frontend/views/genspace/GenSpaceModeTabs.tsx] (worked)
- 2026-08-20T16:32:14Z `fix`: Favourite reorder confirmation now awaits immediate settings persistence before exit and remains active on failure; focused regression and re-review pass. [frontend/views/genspace/GenSpaceModeTabs.tsx]
