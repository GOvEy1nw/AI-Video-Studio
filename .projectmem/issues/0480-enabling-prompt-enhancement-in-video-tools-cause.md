# #0480 Enabling prompt enhancement in Video Tools causes submit-time resolver to return null because it rejects every non-Generate video mode

- 2026-08-02T15:24:08Z `issue`: Enabling prompt enhancement in Video Tools causes submit-time resolver to return null because it rejects every non-Generate video mode [frontend/views/genspace/hooks/useGenSpacePromptEnhancement.ts:42]
- 2026-08-02T16:30:28Z `fix`: Video Tools enhancement no longer enters the rejected preflight path; enabled tools now send semantic enhancePrompt and generate through WanGP. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts]
