# #0018 WanGP preview events synchronously rewrote JPEG output for every event, causing unnecessary disk encoding during generation.

- 2026-07-10T15:03:59Z `issue`: WanGP preview events synchronously rewrote JPEG output for every event, causing unnecessary disk encoding during generation. [backend/services/wangp_bridge.py]
- 2026-07-10T15:03:59Z `attempt`: Rate-limited preview JPEG writes to two per second per generation; bridge tests and pyright pass. (worked)
- 2026-07-10T15:44:36Z `fix`: WanGP preview image writes are throttled to two per second. [backend/services/wangp_bridge.py]
