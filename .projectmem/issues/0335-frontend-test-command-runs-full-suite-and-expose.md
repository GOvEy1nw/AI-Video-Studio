# #0335 Frontend test command runs full suite and exposes pre-existing GenPanelSection disclosure expectation failures

- 2026-07-28T09:21:31Z `issue`: Frontend test command runs full suite and exposes pre-existing GenPanelSection disclosure expectation failures [frontend/views/genspace/components/GenPanelSection.tsx; frontend/views/genspace/components/GenPanelSection.test.tsx]
- 2026-07-28T09:21:57Z `attempt`: Tried direct corepack pnpm exec vitest file filter; Windows pnpm exec could not resolve local vitest binary [frontend/views/genspace/components/GenSpaceControls.test.tsx] (failed)
- 2026-07-28T09:22:19Z `attempt`: Removed literal -- from package-script invocation; focused GenSpaceControls file ran alone and passed 4/4 tests [frontend/views/genspace/components/GenSpaceControls.test.tsx] (partial)
- 2026-07-28T09:23:27Z `attempt`: Reran full frontend suite after music slot change; 74/76 passed and same two unrelated GenPanelSection disclosure assertions failed [frontend/views/genspace/components/GenPanelSection.test.tsx] (failed)
- 2026-07-28T09:59:46Z `attempt`: Full frontend suite after media-menu fixes still passes 74/76 with only same two unrelated GenPanelSection disclosure failures [frontend/views/genspace/components/GenPanelSection.test.tsx] (failed)
- 2026-07-28T10:31:28Z `attempt`: Full frontend suite after selected-generation change still passes 22/23 files; only same two pre-existing GenPanelSection assertions fail [frontend/views/genspace/components/GenPanelSection.test.tsx] (failed)
- 2026-07-28T10:53:49Z `attempt`: Full frontend suite after square-card/header change passes 78/80; only same two unrelated GenPanelSection assertions fail [frontend/views/genspace/components/GenPanelSection.test.tsx] (failed)
