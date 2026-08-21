# #0159 Queue commits expose mutated in-memory state before JSON save and do not roll back on save failure, so an admitted job may run without a durable claim

- 2026-08-20T21:52:43Z `issue`: Queue commits expose mutated in-memory state before JSON save and do not roll back on save failure, so an admitted job may run without a durable claim [backend/handlers/generation_queue_handler.py]
- 2026-08-20T21:53:12Z `attempt`: Made queue commit save its snapshot while state remains locked, restoring the previous state and marking the queue unhealthy on save failure [backend/handlers/generation_queue_handler.py] (partial)
- 2026-08-20T21:54:06Z `attempt`: Focused queue test confirms a failed admission save leaves no queued/active job and makes the queue reject further work [backend/tests/test_generation_queue.py] (worked)
- 2026-08-20T21:54:10Z `fix`: Queue mutations now become visible only after the atomic snapshot save succeeds, with rollback and unhealthy shutdown on persistence failure [backend/handlers/generation_queue_handler.py]
