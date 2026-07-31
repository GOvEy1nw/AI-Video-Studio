# #0419 ReframeEditor previous-aspect ref initializes before aspectMode is declared

- 2026-07-31T10:02:46Z `issue`: ReframeEditor previous-aspect ref initializes before aspectMode is declared [frontend/views/genspace/components/ReframeEditor.tsx]
- 2026-07-31T10:02:58Z `attempt`: Moved ReframeEditor value destructuring before previous-aspect ref initialization [frontend/views/genspace/components/ReframeEditor.tsx] (worked)
- 2026-07-31T10:08:36Z `fix`: ReframeEditor previous-aspect ref initializes after value destructuring; strict TypeScript passes [frontend/views/genspace/components/ReframeEditor.tsx]
