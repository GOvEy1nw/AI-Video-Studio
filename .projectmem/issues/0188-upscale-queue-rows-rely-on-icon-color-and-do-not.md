# #0188 upscale queue rows rely on icon color and do not expose the requested media type as text

- 2026-08-21T10:19:58Z `issue`: upscale queue rows rely on icon color and do not expose the requested media type as text [frontend/components/GenerationQueuePanel.tsx]
- 2026-08-21T10:20:25Z `attempt`: added an explicit media type and mode label to every queue row and marked the decorative icon hidden [frontend/components/GenerationQueuePanel.tsx] (worked)
- 2026-08-21T10:22:48Z `fix`: queue rows now expose media type and mode as text; focused queue tests and strict TypeScript pass [frontend/components/GenerationQueuePanel.tsx]
