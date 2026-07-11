# #0013 Visible Retake control posts to /api/retake, whose WanGP-only handler returns 503; inherited direct Retake path remains.

- 2026-07-10T14:40:58Z `issue`: Visible Retake control posts to /api/retake, whose WanGP-only handler returns 503; inherited direct Retake path remains. [frontend/hooks/use-retake.ts; backend/handlers/retake_handler.py]
- 2026-07-10T14:53:34Z `attempt`: Removed all GenSpace Retake controls, state, request path, and result handling; TypeScript check passes. Legacy editor and Playground Retake controls remain. [frontend/views/GenSpace.tsx] (partial)
- 2026-07-10T14:56:33Z `attempt`: Removed remaining visible Retake controls and editor handoff; TypeScript check passes. Retake backend and unused frontend files remain for deletion. [frontend/views/Playground.tsx; frontend/views/VideoEditor.tsx; frontend/views/editor/ClipContextMenu.tsx] (partial)
- 2026-07-10T14:59:36Z `attempt`: Retake now delegates to WanGP video generation with a trimmed control-video guide; focused integration test proves /api/retake produces a WanGP call. [backend/handlers/retake_handler.py; backend/tests/test_generation.py] (worked)
- 2026-07-10T15:44:08Z `fix`: Retake remains visible and now translates to a trimmed WanGP control-video generation request. [backend/handlers/retake_handler.py]
