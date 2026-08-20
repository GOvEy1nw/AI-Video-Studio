# #0128 Favourite drag reorder cannot move an item onto the next adjacent target

- 2026-08-20T16:06:27Z `issue`: Favourite drag reorder cannot move an item onto the next adjacent target [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-08-20T16:10:24Z `attempt`: Replaced inline splice arithmetic with a pure reorder helper using stable target-index semantics and added two-direction coverage [frontend/views/genspace/workflows.ts] (worked)
- 2026-08-20T16:20:02Z `fix`: Favourite reorder helper now handles upward and downward targets correctly, with two-direction regression coverage. [frontend/views/genspace/workflows.ts]
