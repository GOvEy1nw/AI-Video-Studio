# #0117 Combined media-role canonicalization patch did not match the current media-inputs import/type names, so no changes were applied.

- 2026-07-24T21:50:32Z `issue`: Combined media-role canonicalization patch did not match the current media-inputs import/type names, so no changes were applied. [frontend/views/genspace/logic/media-inputs.ts]
- 2026-07-24T21:50:48Z `attempt`: Tried canonicalizing all guide/audio role consumers in one patch; an outdated media-input import context prevented any edit. [frontend/views/genspace/logic/media-inputs.ts] (failed)
- 2026-07-24T21:51:22Z `attempt`: Retried with current imports and centralized all guide/audio role sets in GenSpace constants for UI, restore, requests, and persistence. [frontend/views/genspace/constants.ts] (worked)
- 2026-07-24T21:51:34Z `fix`: Canonical guide/audio role sets now replace duplicated collections across GenSpace and shared request/restore logic; TypeScript passes. [frontend/views/genspace/constants.ts]
