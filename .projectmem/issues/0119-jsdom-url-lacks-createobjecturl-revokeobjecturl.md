# #0119 jsdom URL lacks createObjectURL/revokeObjectURL, so the new owned-blob cleanup test cannot spy on those methods directly.

- 2026-07-24T21:58:59Z `issue`: jsdom URL lacks createObjectURL/revokeObjectURL, so the new owned-blob cleanup test cannot spy on those methods directly. [frontend/views/genspace/hooks/useGenSpaceMediaInputs.test.ts]
- 2026-07-24T21:59:13Z `attempt`: Defined jsdom URL blob methods with configurable test spies before exercising the hook. [frontend/views/genspace/hooks/useGenSpaceMediaInputs.test.ts] (worked)
- 2026-07-24T21:59:25Z `fix`: Owned object-URL cleanup test now supplies the missing jsdom URL methods and passes. [frontend/views/genspace/hooks/useGenSpaceMediaInputs.test.ts]
