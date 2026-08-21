# #0160 Queue save-failure rollback replaced the AppState-attached GenerationQueueState object, leaving AppState with a stale reference

- 2026-08-20T21:55:52Z `issue`: Queue save-failure rollback replaced the AppState-attached GenerationQueueState object, leaving AppState with a stale reference [backend/handlers/generation_queue_handler.py]
- 2026-08-20T21:56:16Z `attempt`: Restored failed queue commits into the existing GenerationQueueState instance instead of replacing the AppState-attached object [backend/handlers/generation_queue_handler.py] (partial)
- 2026-08-20T21:56:41Z `attempt`: Focused persistence-failure regression confirms the attached queue state object survives rollback unchanged [backend/tests/test_generation_queue.py] (worked)
- 2026-08-20T21:56:46Z `fix`: Save-failure rollback now preserves the canonical GenerationQueueState object attached to AppState [backend/handlers/generation_queue_handler.py]
