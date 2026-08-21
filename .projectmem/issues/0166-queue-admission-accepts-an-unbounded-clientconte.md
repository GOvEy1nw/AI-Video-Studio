# #0166 Queue admission accepts an unbounded clientContext despite the plan's trust-boundary size limit.

- 2026-08-20T22:31:54Z `issue`: Queue admission accepts an unbounded clientContext despite the plan's trust-boundary size limit. [backend/_routes/generation_queue.py]
- 2026-08-20T22:33:03Z `attempt`: Added UTF-8 JSON size validation at 256 KiB before queue admission and a focused oversized-context route test; queue suite passes 8 tests. [backend/_routes/generation_queue.py] (worked)
- 2026-08-20T22:33:11Z `fix`: Queue admission now rejects empty project IDs and client contexts over 256 KiB; focused backend queue suite passes. [backend/_routes/generation_queue.py]
