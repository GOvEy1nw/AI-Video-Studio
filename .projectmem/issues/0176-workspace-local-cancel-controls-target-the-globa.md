# #0176 Workspace-local cancel controls target the globally active job instead of the exact job submitted by that hook instance.

- 2026-08-20T22:59:52Z `issue`: Workspace-local cancel controls target the globally active job instead of the exact job submitted by that hook instance. [frontend/hooks/use-generation.ts]
- 2026-08-20T23:00:51Z `attempt`: Captured each hook's admitted job ID and made its local cancel path target that exact job; added active-A/submitted-B regression coverage pending validation. [frontend/hooks/use-generation.ts] (partial)
- 2026-08-20T23:05:00Z `attempt`: Focused hook regression passed: with job A active and this hook admitting job B, local cancel targets job B; TypeScript is clean. [frontend/hooks/use-generation.ts] (worked)
- 2026-08-20T23:05:09Z `fix`: Confirmed workspace-local cancel targets the exact submitted job ID rather than the globally active job. [frontend/hooks/use-generation.ts]
