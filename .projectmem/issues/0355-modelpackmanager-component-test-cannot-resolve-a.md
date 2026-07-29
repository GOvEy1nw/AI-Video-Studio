# #0355 ModelPackManager component test cannot resolve @ alias through transfer-format import under current Vitest invocation

- 2026-07-28T14:31:39Z `issue`: ModelPackManager component test cannot resolve @ alias through transfer-format import under current Vitest invocation [frontend/components/ModelPackManager.test.tsx]
- 2026-07-28T14:31:48Z `attempt`: Initial characterization run imported ModelPackManager directly; Vitest failed before tests because @/lib/transfer-format alias was unresolved. [frontend/components/ModelPackManager.test.tsx] (failed)
- 2026-07-28T14:32:23Z `attempt`: Tried vi.mock for @/lib/transfer-format; Vite import analysis still rejected unresolved alias before mock interception. [frontend/components/ModelPackManager.test.tsx] (failed)
- 2026-07-28T14:32:57Z `attempt`: Changed transfer-format to direct relative import; test now reaches shared Button, whose own @/lib/utils alias remains unresolved. [frontend/components/ModelPackManager.tsx; frontend/components/ModelPackManager.test.tsx] (partial)
- 2026-07-28T14:33:31Z `attempt`: Used direct transfer-format import and mocked shared Button at test boundary; characterization now executes and fails only on missing grouped-card behavior. [frontend/components/ModelPackManager.tsx; frontend/components/ModelPackManager.test.tsx] (worked)
- 2026-07-28T14:33:39Z `fix`: ModelPackManager test now isolates shared Button and uses resolvable direct transfer-format import; test executes to intended characterization assertion. [frontend/components/ModelPackManager.tsx; frontend/components/ModelPackManager.test.tsx]
