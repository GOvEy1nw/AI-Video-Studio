# #0010 Speech requests omit explicit prompt_enhancer and duration defaults, so disabled enhancement can still run and WanGP can inherit non-auto duration.

- 2026-08-11T13:13:04Z `issue`: Speech requests omit explicit prompt_enhancer and duration defaults, so disabled enhancement can still run and WanGP can inherit non-auto duration. [backend/services/wangp_bridge.py]
- 2026-08-11T13:58:29Z `attempt`: Made Speech bridge settings explicit for prompt_enhancer T/empty and duration_seconds 0; focused manifest tests pass. [backend/services/wangp_bridge.py] (worked)
- 2026-08-11T13:58:36Z `fix`: WanGP Speech manifests now preserve disabled enhancement and always use automatic duration, verified for both enhancer states. [backend/services/wangp_bridge.py]
