# #0167 Queue admission never sets isGenerating, so generation buttons can double-submit while the admission request is still in flight.

- 2026-08-20T22:36:22Z `issue`: Queue admission never sets isGenerating, so generation buttons can double-submit while the admission request is still in flight. [frontend/hooks/use-generation.ts]
- 2026-08-20T22:37:30Z `attempt`: useGeneration now sets isGenerating only during queue admission, resets after 202, and retains errors on rejection; focused hook test passes. [frontend/hooks/use-generation.ts] (worked)
- 2026-08-20T22:37:40Z `fix`: Generation buttons now block duplicate clicks only during queue admission and re-enable after durable acceptance; focused test passes. [frontend/hooks/use-generation.ts]
