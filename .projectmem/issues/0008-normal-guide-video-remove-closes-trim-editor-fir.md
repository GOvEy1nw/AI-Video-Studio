# #0008 Normal guide video remove closes trim editor first, and video input leaks into image mode

- 2026-07-09T20:30:57Z `issue`: Normal guide video remove closes trim editor first, and video input leaks into image mode [frontend/views/GenSpace.tsx]
- 2026-07-09T20:33:23Z `attempt`: Guarded outside-click handling with data-media-menu and filtered non-image inputs on image-mode entry; TypeScript and diff checks pass [frontend/views/GenSpace.tsx] (worked)
- 2026-07-09T20:33:27Z `fix`: Remove now completes on first click, and switching to image mode drops video/audio guide inputs [frontend/views/GenSpace.tsx]
