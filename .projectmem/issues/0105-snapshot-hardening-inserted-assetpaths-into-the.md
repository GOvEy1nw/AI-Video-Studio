# #0105 Snapshot hardening inserted assetPaths into the video command-builder arguments instead of the video submission snapshot, and left one stale import.

- 2026-07-24T21:20:40Z `issue`: Snapshot hardening inserted assetPaths into the video command-builder arguments instead of the video submission snapshot, and left one stale import. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts]
- 2026-07-24T21:20:55Z `attempt`: Moved assetPaths from video command arguments into VideoSubmissionSnapshot and removed the unused persistence import. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts] (worked)
- 2026-07-24T21:21:05Z `fix`: Strict TypeScript confirms submission snapshot asset paths are attached at the correct boundary. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts]
