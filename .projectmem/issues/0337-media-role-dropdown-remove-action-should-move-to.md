# #0337 Media role dropdown Remove action should move to an X control on each occupied media slot

- 2026-07-28T09:52:27Z `issue`: Media role dropdown Remove action should move to an X control on each occupied media slot [frontend/views/genspace/components/MediaInputSlot.tsx; frontend/views/genspace/components/MediaRoleMenu.tsx]
- 2026-07-28T09:56:36Z `attempt`: Moved removal callback into shared MediaInputSlot hover-corner X and removed Remove action from MediaRoleMenu across image/video/music [frontend/views/genspace/components/MediaInputSlot.tsx] (partial)
- 2026-07-28T09:57:53Z `attempt`: Focused test confirms dropdown has no Remove action and slot X invokes music input removal; TypeScript validates image/video/music wiring [frontend/views/genspace/components/MediaInputSlot.tsx] (worked)
- 2026-07-28T10:00:16Z `fix`: Shared occupied media slots now show top-right hover X; dropdown Remove row removed across image, video, and music; confirmed by focused test and Electron QA [frontend/views/genspace/components/MediaInputSlot.tsx; frontend/views/genspace/components/MediaRoleMenu.tsx]
