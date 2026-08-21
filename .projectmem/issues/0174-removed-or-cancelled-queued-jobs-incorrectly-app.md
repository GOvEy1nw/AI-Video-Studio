# #0174 Removed or cancelled queued jobs incorrectly appear in the Attention section instead of disappearing from the user-visible queue.

- 2026-08-20T22:53:17Z `issue`: Removed or cancelled queued jobs incorrectly appear in the Attention section instead of disappearing from the user-visible queue. [backend/handlers/generation_queue_handler.py]
- 2026-08-20T22:54:01Z `attempt`: Filtered queue attention to failed, interrupted, and completed-unacknowledged jobs; added cancellation regression assertion pending test rerun. [backend/handlers/generation_queue_handler.py] (partial)
- 2026-08-20T22:56:58Z `attempt`: Focused queue suite confirmed cancelled jobs remain retained for history but are omitted from the user-facing Attention list. [backend/handlers/generation_queue_handler.py] (worked)
- 2026-08-20T22:57:03Z `fix`: Confirmed Remove/Cancel no longer creates spurious attention items; 14 focused backend queue tests pass. [backend/handlers/generation_queue_handler.py]
