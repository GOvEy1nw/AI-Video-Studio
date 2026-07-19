# #0044 Gen Space asset cards need persistent top-left identity controls: always-visible media type icon before an always-visible multi-take selector, independent of hover overlays.

- 2026-07-18T10:38:34Z `issue`: Gen Space asset cards need persistent top-left identity controls: always-visible media type icon before an always-visible multi-take selector, independent of hover overlays. [frontend/views/GenSpace.tsx]
- 2026-07-18T10:40:53Z `attempt`: Moved multi-take selector outside hover overlay and added persistent leading media-type badge for image, video, and audio assets. TypeScript/build passed; native Electron screenshot confirmed visible video/image badges and 6/6, 8/8 selectors without hover. [frontend/views/GenSpace.tsx] (worked)
- 2026-07-18T10:40:54Z `fix`: Gen Space grid cards now always show media type at top-left, followed by persistent take navigation when multiple takes exist. [frontend/views/GenSpace.tsx]
