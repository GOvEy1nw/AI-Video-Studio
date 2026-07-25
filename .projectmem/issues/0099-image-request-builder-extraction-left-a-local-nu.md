# #0099 Image request-builder extraction left a local numSteps value used only by the moved body builder.

- 2026-07-24T20:24:18Z `issue`: Image request-builder extraction left a local numSteps value used only by the moved body builder. [frontend/hooks/use-generation.ts]
- 2026-07-24T20:24:25Z `attempt`: Removed the numSteps local now computed by buildImageRequestBody. [frontend/hooks/use-generation.ts] (partial)
- 2026-07-24T20:24:50Z `attempt`: Strict TypeScript and all twelve frontend tests pass after the request-builder cleanup. [frontend/hooks/use-generation.ts] (worked)
- 2026-07-24T20:24:56Z `fix`: Image and video transport request bodies are isolated and covered by passing tests. [frontend/hooks/generation/request-builders.ts]
