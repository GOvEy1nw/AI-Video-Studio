# #0633 AIVS-024 VideoThumbnailCard still attaches and loads hover video while disabled and does not release active hover media when disabled mid-hover.

- 2026-08-05T16:59:23Z `issue`: AIVS-024 VideoThumbnailCard still attaches and loads hover video while disabled and does not release active hover media when disabled mid-hover. [frontend/views/editor/VideoThumbnailCard.tsx]
- 2026-08-05T17:01:33Z `attempt`: Gated thumbnail hover handlers/effects by enabled and reset rAF, source, readiness, and scrub state on disable. [frontend/views/editor/VideoThumbnailCard.tsx] (partial)
- 2026-08-05T17:03:39Z `attempt`: Focused VideoThumbnailCard enabled-transition test passes; disabled rerender removes hover source and calls load cleanup. [frontend/views/editor/VideoThumbnailCard.test.tsx] (worked)
- 2026-08-05T17:03:44Z `fix`: VideoThumbnailCard now gates hover media by enabled and clears source/rAF/state on disable; focused lifecycle test passes. [frontend/views/editor/VideoThumbnailCard.tsx]
