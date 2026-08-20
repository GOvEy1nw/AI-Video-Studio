# #0131 Favourite reorder mode can remain active after removing the final favourite, leaving no tick control to exit and reactivating later when a favourite returns.

- 2026-08-20T16:17:43Z `issue`: Favourite reorder mode can remain active after removing the final favourite, leaving no tick control to exit and reactivating later when a favourite returns. [frontend/views/genspace/GenSpaceModeTabs.tsx]
- 2026-08-20T16:19:07Z `attempt`: Clear favourite reorder, drag, menu, and click-suppression state when the persisted favourites list becomes empty; focused regression passes. [frontend/views/genspace/GenSpaceModeTabs.tsx] (worked)
- 2026-08-20T16:20:16Z `fix`: Empty favourites now clear reorder, drag, menu, and click-suppression state; focused interaction regression and TypeScript build pass. [frontend/views/genspace/GenSpaceModeTabs.tsx]
