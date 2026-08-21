# #0172 A terminal-state persistence failure can escape the worker thread while it retries the same failed terminal commit.

- 2026-08-20T22:45:31Z `issue`: A terminal-state persistence failure can escape the worker thread while it retries the same failed terminal commit. [backend/handlers/generation_queue_handler.py]
- 2026-08-20T22:50:34Z `attempt`: Stopped worker dispatch after claim or terminal-state persistence failure so jobs cannot execute or advance past an undurable lifecycle commit. [backend/handlers/generation_queue_handler.py] (worked)
- 2026-08-20T22:50:38Z `fix`: Confirmed durable claim precedes execution and terminal save failure halts subsequent dispatch; focused backend tests pass. [backend/handlers/generation_queue_handler.py]
