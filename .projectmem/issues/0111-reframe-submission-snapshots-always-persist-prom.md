# #0111 Reframe submission snapshots always persist prompt `outpaint`, discarding a non-blank user prompt from generated asset metadata.

- 2026-07-24T21:40:23Z `issue`: Reframe submission snapshots always persist prompt `outpaint`, discarding a non-blank user prompt from generated asset metadata. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts]
- 2026-07-24T21:47:54Z `attempt`: Stored the resolved Reframe command prompt in the immutable submission snapshot instead of hard-coding `outpaint`. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts] (worked)
- 2026-07-24T21:56:48Z `fix`: Non-blank Reframe prompts now survive submission and asset persistence; focused asset-builder regression test passes. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts]
