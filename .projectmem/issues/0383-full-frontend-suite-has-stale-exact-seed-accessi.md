# #0383 Full frontend suite has stale exact Seed accessible-name assertion after trigger label changed to Random seed

- 2026-07-29T14:20:39Z `issue`: Full frontend suite has stale exact Seed accessible-name assertion after trigger label changed to Random seed [frontend/views/genspace/components/GenSpaceControls.test.tsx]
- 2026-07-29T14:20:44Z `attempt`: Ran full frontend suite after gallery changes; only stale exact-name Seed menu assertion failed (108/109 passed) [frontend/views/genspace/components/GenSpaceControls.test.tsx] (failed)
- 2026-07-29T14:21:14Z `attempt`: Relaxed Seed trigger query to case-insensitive semantic name matching, supporting current Random seed and locked-seed labels [frontend/views/genspace/components/GenSpaceControls.test.tsx] (worked)
- 2026-07-29T14:22:19Z `fix`: Seed menu alignment test now matches semantic seed names instead of one exact label; full suite passes 109/109 [frontend/views/genspace/components/GenSpaceControls.test.tsx]
