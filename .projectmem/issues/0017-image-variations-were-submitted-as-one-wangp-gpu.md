# #0017 Image variations were submitted as one WanGP GPU batch, risking avoidable VRAM OOM on heavy profiles.

- 2026-07-10T15:02:45Z `issue`: Image variations were submitted as one WanGP GPU batch, risking avoidable VRAM OOM on heavy profiles. [backend/handlers/image_generation_handler.py]
- 2026-07-10T15:02:45Z `attempt`: Added profile variation limits and sequential WanGP chunks with deterministic seed offsets and cancellation checks; generation tests and pyright pass. (worked)
- 2026-07-10T15:44:25Z `fix`: Image variations are profile-bounded and submitted to WanGP in conservative sequential chunks. [backend/handlers/image_generation_handler.py]
