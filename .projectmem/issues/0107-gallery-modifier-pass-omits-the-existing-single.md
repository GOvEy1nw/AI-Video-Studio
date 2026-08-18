# #0107 Gallery modifier pass omits the existing single selection on first Ctrl-click, can retain an invisible Shift anchor, and forwards KeyboardEvent as MouseEvent.

- 2026-08-17T13:20:02Z `issue`: Gallery modifier pass omits the existing single selection on first Ctrl-click, can retain an invisible Shift anchor, and forwards KeyboardEvent as MouseEvent. [frontend/components/GalleryAssetLibrary.tsx]
- 2026-08-17T13:21:29Z `attempt`: Seeded first Ctrl selection from the existing active asset, cleared invisible anchors with guarded range fallback, and dispatched genuine modifier-aware mouse clicks from keyboard activation. [frontend/components/GalleryAssetLibrary.tsx] (worked)
- 2026-08-17T13:22:33Z `fix`: Gallery desktop modifiers now seed the active selection, guard filtered range anchors, and preserve real mouse events for keyboard activation; 11 focused tests and TypeScript pass. [frontend/components/GalleryAssetLibrary.tsx]
