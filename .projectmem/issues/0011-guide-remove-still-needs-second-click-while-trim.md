# #0011 Guide remove still needs second click while trim editor is open despite pointer/mouse remove handler

- 2026-07-09T20:49:53Z `issue`: Guide remove still needs second click while trim editor is open despite pointer/mouse remove handler [frontend/views/GenSpace.tsx]
- 2026-07-09T20:50:26Z `attempt`: Changed updateGuideTrim to functional state update so late trim editor onChange cannot restore removed guide media; typecheck passes [frontend/views/GenSpace.tsx] (worked)
- 2026-07-09T20:50:31Z `fix`: Late trim editor updates no longer re-add removed guide video, so first remove click persists while trim UI is open [frontend/views/GenSpace.tsx]
