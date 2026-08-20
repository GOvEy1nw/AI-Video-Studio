# #0121 Pinned video workflows with no installed compatible model can still leave Generate enabled against a stale profile

- 2026-08-19T17:04:36Z `issue`: Pinned video workflows with no installed compatible model can still leave Generate enabled against a stale profile [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-08-19T17:10:07Z `attempt`: Blocked unavailable favourite selection and gated video submission, but review found the upscale bypass must depend on the active workflow rather than stale selectedTool state [frontend/views/genspace/hooks/useGenSpaceController.tsx] (partial)
- 2026-08-19T17:10:30Z `attempt`: Scoped the model-free upscale exception to the active upscale workflow, preserving guards for stale generate/retake states [frontend/views/genspace/hooks/useGenSpaceController.tsx] (worked)
- 2026-08-19T17:11:34Z `attempt`: TypeScript rejected the intentionally partial ModelProfile fixture in the new stale-profile regression test [frontend/views/genspace/workflows.test.ts] (partial)
- 2026-08-19T17:11:53Z `attempt`: Marked the deliberately minimal stale-profile fixture through unknown so strict TypeScript accepts the focused regression case [frontend/views/genspace/workflows.test.ts] (worked)
- 2026-08-19T17:12:44Z `fix`: Unavailable pinned video workflows now cannot activate; stale or incompatible selected profiles disable submission, with focused regression coverage and passing TypeScript/build [frontend/views/genspace/hooks/useGenSpaceController.tsx]
