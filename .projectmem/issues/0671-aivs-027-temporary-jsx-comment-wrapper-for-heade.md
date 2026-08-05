# #0671 AIVS-027 temporary JSX-comment wrapper for header extraction cannot contain nested JSX comments and breaks TypeScript parsing.

- 2026-08-05T19:10:20Z `issue`: AIVS-027 temporary JSX-comment wrapper for header extraction cannot contain nested JSX comments and breaks TypeScript parsing. [frontend/views/VideoEditor.tsx]
- 2026-08-05T19:10:35Z `attempt`: Reverted nested JSX-comment wrapper; standalone header component remains type-safe. [frontend/views/VideoEditor.tsx] (worked)
- 2026-08-05T19:10:36Z `fix`: VideoEditor JSX parser restored; TypeScript passes after reverting invalid comment wrapper. [frontend/views/VideoEditor.tsx]
