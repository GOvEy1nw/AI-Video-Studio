# #0170 Queue-backed legacy routes mark completed jobs as requiring attention forever even though requires_acknowledgement is false.

- 2026-08-20T22:40:46Z `issue`: Queue-backed legacy routes mark completed jobs as requiring attention forever even though requires_acknowledgement is false. [backend/handlers/generation_queue_handler.py]
- 2026-08-20T22:50:19Z `attempt`: Auto-acknowledged queue-backed legacy adapter completions so blocking compatibility calls do not leave false attention items; focused queue suite passed. [backend/handlers/generation_queue_handler.py] (worked)
- 2026-08-20T22:50:22Z `fix`: Confirmed legacy blocking completions auto-acknowledge without leaking attention state; backend queue tests pass. [backend/handlers/generation_queue_handler.py]
