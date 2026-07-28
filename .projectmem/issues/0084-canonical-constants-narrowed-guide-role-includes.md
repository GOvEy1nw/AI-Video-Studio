# #0084 Canonical constants narrowed guide-role includes and default model state, causing eight GenSpace TypeScript errors.

- 2026-07-24T19:53:03Z `issue`: Canonical constants narrowed guide-role includes and default model state, causing eight GenSpace TypeScript errors. [frontend/views/genspace/constants.ts]
- 2026-07-24T19:53:24Z `attempt`: Widened the canonical role list to readonly strings and the default model state to the existing fast/pro union. [frontend/views/genspace/constants.ts] (partial)
- 2026-07-24T19:53:46Z `attempt`: Narrowed restored GenSpace model settings to the already-enforced fast/pro union at the shared settings adapter. [frontend/lib/apply-generation-params.ts] (partial)
- 2026-07-24T19:53:56Z `attempt`: Reran strict TypeScript after widening constants and narrowing restored model values; all errors cleared. [frontend/views/genspace/constants.ts; frontend/lib/apply-generation-params.ts] (worked)
- 2026-07-24T19:54:01Z `fix`: Canonical roles/default settings preserve prior inference and strict TypeScript now passes. [frontend/views/genspace/constants.ts]
