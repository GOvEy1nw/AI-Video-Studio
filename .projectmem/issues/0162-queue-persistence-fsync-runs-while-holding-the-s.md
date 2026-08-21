# #0162 Queue persistence fsync runs while holding the shared AppState RLock, violating the queue plan and blocking unrelated state operations

- 2026-08-20T22:00:25Z `issue`: Queue persistence fsync runs while holding the shared AppState RLock, violating the queue plan and blocking unrelated state operations [backend/handlers/generation_queue_handler.py]
- 2026-08-20T22:01:05Z `attempt`: Gave GenerationQueueHandler its own RLock and removed the shared AppState lock from queue construction and tests [backend/handlers/generation_queue_handler.py] (partial)
- 2026-08-20T22:02:04Z `attempt`: Focused queue suite passes with an independent queue lock, preserving lifecycle and cancellation behavior [backend/tests/test_generation_queue.py] (worked)
- 2026-08-20T22:02:09Z `fix`: GenerationQueueHandler now uses its own short-scope lock, so durable JSON fsync no longer blocks shared AppState operations [backend/handlers/generation_queue_handler.py]
