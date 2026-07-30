# #0394 Region restore patch context omitted import type syntax, so apply_patch could not match file

- 2026-07-29T16:11:46Z `issue`: Region restore patch context omitted import type syntax, so apply_patch could not match file [frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts]
- 2026-07-29T16:11:51Z `attempt`: Applied multi-hunk Region restore patch against import block without its existing type-only syntax; no file change occurred [frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts] (failed)
- 2026-07-29T16:12:09Z `attempt`: Retried with exact type-only import context and smaller Region restore hunks; patch applied cleanly [frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts] (worked)
- 2026-07-29T16:12:13Z `fix`: Region restore patch applied using exact current import syntax; no source work was lost [frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts]
