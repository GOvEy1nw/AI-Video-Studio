# #0094 Generation-request extraction left GUIDE_MEDIA_ROLES unused in GenSpaceWorkspace.

- 2026-07-24T20:12:02Z `issue`: Generation-request extraction left GUIDE_MEDIA_ROLES unused in GenSpaceWorkspace. [frontend/views/genspace/GenSpaceWorkspace.tsx]
- 2026-07-24T20:12:17Z `attempt`: Removed the role list now owned by the pure request builder. [frontend/views/genspace/GenSpaceWorkspace.tsx] (partial)
- 2026-07-24T20:12:35Z `attempt`: Strict TypeScript passes after the request-builder import cleanup. [frontend/views/genspace/GenSpaceWorkspace.tsx] (worked)
- 2026-07-24T20:12:41Z `fix`: Guide-role request logic is isolated in generation-requests with a clean workspace compile. [frontend/views/genspace/logic/generation-requests.ts]
