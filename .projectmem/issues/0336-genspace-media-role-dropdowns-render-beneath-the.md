# #0336 GenSpace media role dropdowns render beneath the fixed project header and become obscured

- 2026-07-28T09:52:24Z `issue`: GenSpace media role dropdowns render beneath the fixed project header and become obscured [frontend/views/genspace/components/MediaRoleMenu.tsx; frontend/views/Project.tsx]
- 2026-07-28T09:56:33Z `attempt`: Changed shared MediaRoleMenu from upward bottom-full placement to downward top-full placement inside clipped sidebar [frontend/views/genspace/components/MediaRoleMenu.tsx] (partial)
- 2026-07-28T09:57:48Z `attempt`: Focused test confirms media role menu renders with downward top-full placement; TypeScript passes [frontend/views/genspace/components/MediaRoleMenu.tsx] (worked)
- 2026-07-28T10:00:10Z `fix`: Media role menus now open below slots and remain fully visible beneath project header; confirmed in running Electron app [frontend/views/genspace/components/MediaRoleMenu.tsx]
