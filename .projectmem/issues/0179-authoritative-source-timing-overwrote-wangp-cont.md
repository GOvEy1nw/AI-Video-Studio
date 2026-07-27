# #0179 Authoritative source timing overwrote WanGP continuation duration_seconds with total output duration

- 2026-07-26T11:33:44Z `issue`: Authoritative source timing overwrote WanGP continuation duration_seconds with total output duration [backend/handlers/video_generation_handler.py]
- 2026-07-26T11:34:31Z `attempt`: Separated requested generation duration from normalized total source timing while returning the authoritative output frame count [backend/handlers/video_generation_handler.py] (worked)
- 2026-07-26T11:35:10Z `fix`: Continuation preserves its requested extension duration while reporting normalized total timing [backend/handlers/video_generation_handler.py]
