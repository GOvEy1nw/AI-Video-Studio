# #0379 Asset Library filters require active-inclusion semantics and grid size must snap to 4/3/2/1 columns

- 2026-07-29T14:09:47Z `issue`: Asset Library filters require active-inclusion semantics and grid size must snap to 4/3/2/1 columns [frontend/components/GalleryAssetLibrary.tsx; frontend/lib/gallery-filters.ts]
- 2026-07-29T14:14:59Z `attempt`: Changed default filters to empty selections and made non-empty type/source selections inclusive, with groups combined by AND [frontend/lib/gallery-filters.ts] (partial)
- 2026-07-29T14:15:17Z `attempt`: Allowed the final active media/source chip to turn off and exposed chip state through aria-pressed [frontend/components/GalleryFilters.tsx] (partial)
- 2026-07-29T14:15:46Z `attempt`: Replaced continuous pixel-size range with a four-step 4-to-1 column slider and accessible column value text [frontend/components/GalleryViewControls.tsx] (partial)
- 2026-07-29T14:16:05Z `attempt`: Changed shared Asset Library contract/rendering from pixel card size to exact grid column count [frontend/components/GalleryAssetLibrary.tsx] (partial)
- 2026-07-29T14:16:34Z `attempt`: Migrated GenSpace gallery state and shared-library props to a typed 3-column default [frontend/views/genspace/hooks/useGenSpaceGallery.ts] (partial)
- 2026-07-29T14:16:58Z `attempt`: Migrated Director shared Asset Library to typed grid-column state with 3-column default [frontend/views/director/DirectorSidebar.tsx] (partial)
- 2026-07-29T14:17:22Z `attempt`: Migrated Video Editor shared Asset Library to typed grid-column state with 3-column default [frontend/views/editor/LeftPanel.tsx] (partial)
- 2026-07-29T14:20:06Z `attempt`: Focused Asset Library and GenSpace gallery interaction tests pass 8/8 after shared filter/grid migration [frontend/components/GalleryAssetLibrary.test.tsx; frontend/views/genspace/GenSpaceGallery.test.tsx] (worked)
- 2026-07-29T14:21:54Z `attempt`: TypeScript, focused tests 8/8, full frontend suite 109/109, production build, and diff check pass [shared Asset Library filter and grid controls] (worked)
- 2026-07-29T14:22:01Z `fix`: Inverted shared gallery filters and replaced continuous card sizing with snapped 4/3/2/1-column control across GenSpace, Director, and Video Editor [frontend/components/GalleryAssetLibrary.tsx; frontend/lib/gallery-filters.ts]
