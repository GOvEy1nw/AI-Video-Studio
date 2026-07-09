# #0009 Remove action still only closes trim editor, and media inputs collapse on mode changes

- 2026-07-09T20:36:26Z `issue`: Remove action still only closes trim editor, and media inputs collapse on mode changes [frontend/views/GenSpace.tsx]
- 2026-07-09T20:37:58Z `attempt`: Remove runs on pointer activation with keyboard-only click fallback; removed mode/profile collapse effect; TypeScript and diff checks pass [frontend/views/GenSpace.tsx] (worked)
- 2026-07-09T20:38:13Z `fix`: Remove now deletes guide media during first pointer activation, and media input expansion persists across mode/profile changes [frontend/views/GenSpace.tsx]
