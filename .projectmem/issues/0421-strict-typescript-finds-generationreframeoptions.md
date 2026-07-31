# #0421 Strict TypeScript finds GenerationReframeOptions still narrows aspectMode to old presets

- 2026-07-31T10:07:28Z `issue`: Strict TypeScript finds GenerationReframeOptions still narrows aspectMode to old presets [frontend/hooks/use-generation.ts]
- 2026-07-31T10:08:10Z `attempt`: Expanded shared generation Reframe request type to all curated aspect ratios [frontend/hooks/generation/request-builders.ts] (partial)
- 2026-07-31T10:08:28Z `attempt`: Strict TypeScript passed after expanding shared Reframe request aspect type [frontend/hooks/generation/request-builders.ts] (worked)
- 2026-07-31T10:08:32Z `fix`: Generation Reframe request contract now accepts every curated aspect ratio; strict TypeScript passes [frontend/hooks/generation/request-builders.ts]
