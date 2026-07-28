# #0115 Panel-contract split removed the GenSpaceSettings import still required by image/video/reframe snapshot types.

- 2026-07-24T21:46:52Z `issue`: Panel-contract split removed the GenSpaceSettings import still required by image/video/reframe snapshot types. [frontend/views/genspace/types.ts]
- 2026-07-24T21:46:59Z `attempt`: Restored the type-only GenSpaceSettings import used by submission snapshot contracts. [frontend/views/genspace/types.ts] (worked)
- 2026-07-24T21:47:08Z `fix`: Panel contracts and snapshot types compile cleanly with the canonical settings import restored. [frontend/views/genspace/types.ts]
