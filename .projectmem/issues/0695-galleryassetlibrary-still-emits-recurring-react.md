# #0695 GalleryAssetLibrary still emits recurring React maximum-update-depth errors in the live Project workspace after the initial layout-effect removal.

- 2026-08-07T09:15:30Z `issue`: GalleryAssetLibrary still emits recurring React maximum-update-depth errors in the live Project workspace after the initial layout-effect removal. [frontend/components/GalleryAssetLibrary.tsx]
- 2026-08-07T09:16:45Z `attempt`: Changed selection pruning to skip the setter when no multi-selected assets exist and to publish only an actually pruned selection. [frontend/components/GalleryAssetLibrary.tsx] (partial)
- 2026-08-07T09:20:52Z `attempt`: Selection-pruning guard did not stop the recurring warnings; debugger tracing showed the active setter is useGenSpaceSettingsState's music profile effect. [frontend/components/GalleryAssetLibrary.tsx] (failed)
- 2026-08-07T09:27:54Z `fix`: Closed the Gallery attribution after debugger tracing: its selection effect was not the source of the warning; the actual passive loop was in music profile normalization.
