# #0721 AIVS-043 Speech submit is blocked by the shared prompt guard and callback dependencies omit current Speech settings/generator.

- 2026-08-09T11:29:25Z `issue`: AIVS-043 Speech submit is blocked by the shared prompt guard and callback dependencies omit current Speech settings/generator. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts]
- 2026-08-09T11:45:31Z `attempt`: Moved Speech submission ahead of the unrelated shared-prompt guard and added current speech state/callback dependencies; rerender regression passed. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts] (worked)
- 2026-08-09T11:45:35Z `fix`: Speech submits its authored segment script without requiring the image/video prompt and uses current state after rerenders; focused regression passed. [frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts]
