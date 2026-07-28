# #0166 Frontend strict typecheck fails because existing role-policy test fixtures predate the new required media/crop/influence fields.

- 2026-07-26T10:51:31Z `issue`: Frontend strict typecheck fails because existing role-policy test fixtures predate the new required media/crop/influence fields. [frontend/types/model-profiles.ts]
- 2026-07-26T10:51:35Z `attempt`: Added the exact frontend profile contract and ran tsc; three legacy test fixtures lacked the new role policy fields. [frontend/types/model-profiles.ts] (partial)
- 2026-07-26T10:52:10Z `attempt`: Made the newly added role policy fields optional on the frontend compatibility boundary while the backend always serializes them; tsc now passes. [frontend/types/model-profiles.ts] (worked)
- 2026-07-26T10:52:14Z `fix`: New role policies are backwards-compatible with old in-memory fixtures/projects and remain fully populated by current API responses. [frontend/types/model-profiles.ts]
