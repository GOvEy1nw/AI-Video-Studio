# #0168 Image workflow hook emits duplicate profile fallback while the parent profile update is pending

- 2026-07-26T10:59:23Z `issue`: Image workflow hook emits duplicate profile fallback while the parent profile update is pending [frontend/views/genspace/hooks/useGenSpaceImageTools.tsx]
- 2026-07-26T10:59:38Z `attempt`: Tracked the pending workflow profile so the fallback effect waits for the controlled parent update [frontend/views/genspace/hooks/useGenSpaceImageTools.tsx] (worked)
- 2026-07-26T10:59:54Z `attempt`: Pending-profile guard still allowed a duplicate edit callback because the fallback effect ran after the prop caught up and the mode transition had not settled [frontend/views/genspace/hooks/useGenSpaceImageTools.tsx] (failed)
- 2026-07-26T11:00:07Z `attempt`: Applied the pending-profile guard to the fallback effect itself [frontend/views/genspace/hooks/useGenSpaceImageTools.tsx] (worked)
- 2026-07-26T11:00:30Z `fix`: Workflow profile changes now suppress duplicate fallback callbacks while controlled state catches up [frontend/views/genspace/hooks/useGenSpaceImageTools.tsx]
