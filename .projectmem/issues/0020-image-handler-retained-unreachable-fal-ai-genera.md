# #0020 Image handler retained unreachable fal.ai generation fallback despite WanGP-only enforcement.

- 2026-07-10T15:11:07Z `issue`: Image handler retained unreachable fal.ai generation fallback despite WanGP-only enforcement. [backend/handlers/image_generation_handler.py]
- 2026-07-10T15:11:07Z `attempt`: Deleted fal.ai image fallback and its handler dependency; pyright and focused generation tests pass. (worked)
- 2026-07-10T15:44:49Z `fix`: Unreachable fal.ai image generation fallback and its app wiring were removed. [backend/handlers/image_generation_handler.py]
