# #0604 After AIVS-020 shared model-profile refactor, GenSpace remains indefinitely on Loading models and generation stays disabled

- 2026-08-05T14:32:46Z `issue`: After AIVS-020 shared model-profile refactor, GenSpace remains indefinitely on Loading models and generation stays disabled [frontend/contexts/ModelProfilesContext.tsx]
- 2026-08-05T14:38:31Z `attempt`: Added root-level Strict Mode regression and reset ModelProfilesProvider mounted guard during effect setup replay [frontend/contexts/ModelProfilesContext.tsx] (worked)
- 2026-08-05T14:41:08Z `fix`: ModelProfilesProvider now restores mounted state during Strict Mode effect setup replay; root Strict Mode regression, 164 frontend tests, TypeScript, production build, and ship review pass [frontend/contexts/ModelProfilesContext.tsx]
