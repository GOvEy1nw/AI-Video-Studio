# #0010 Remove still takes two clicks when normal guide trim UI is open

- 2026-07-09T20:45:20Z `issue`: Remove still takes two clicks when normal guide trim UI is open [frontend/views/GenSpace.tsx]
- 2026-07-09T20:47:53Z `attempt`: Changed remove to functional input update, clears guide_slot/trim state for removed item, and added mouse-down fallback on remove buttons; typecheck passes [frontend/views/GenSpace.tsx] (worked)
- 2026-07-09T20:48:02Z `fix`: Remove now clears guide trim/menu state and removes the guide media through a functional update on first activation [frontend/views/GenSpace.tsx]
