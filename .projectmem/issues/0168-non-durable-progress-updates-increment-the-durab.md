# #0168 Non-durable progress updates increment the durable queue revision, allowing revision rollback after restart and spurious reorder conflicts.

- 2026-08-20T22:38:33Z `issue`: Non-durable progress updates increment the durable queue revision, allowing revision rollback after restart and spurious reorder conflicts. [backend/handlers/generation_queue_handler.py]
- 2026-08-20T22:40:00Z `attempt`: Progress remains job-scoped runtime state but no longer advances the durable structural revision; focused test asserts revision stability. [backend/handlers/generation_queue_handler.py] (worked)
- 2026-08-20T22:40:06Z `fix`: Non-durable progress no longer causes durable revision rollback or reorder conflicts; backend queue suite passes. [backend/handlers/generation_queue_handler.py]
