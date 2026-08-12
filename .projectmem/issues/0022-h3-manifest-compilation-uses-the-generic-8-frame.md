# #0022 H3 manifest compilation uses the generic 8-frame grid, permits duplicate singleton roles that overwrite media, and accepts role/type mismatches before transforms.

- 2026-08-11T16:11:26Z `issue`: H3 manifest compilation uses the generic 8-frame grid, permits duplicate singleton roles that overwrite media, and accepts role/type mismatches before transforms. [backend/handlers/video_generation_handler.py]
- 2026-08-11T16:14:47Z `attempt`: H3 now uses its 5+17n, 107-minimum frame grid; singleton and media-type validation are enforced before transforms, with focused tests and Pyright passing. [backend/services/wangp_bridge.py] (worked)
- 2026-08-11T16:15:01Z `fix`: H3 manifests now normalize to the verified frame grid and reject duplicate singleton or role/type-mismatched media without leaving generation active. [backend/services/wangp_bridge.py]
