# #0089 AIVS-015 backend Pyright reports an unused Path import in MediaUpscaleHandler.

- 2026-08-16T19:33:52Z `issue`: AIVS-015 backend Pyright reports an unused Path import in MediaUpscaleHandler. [backend/handlers/media_upscale_handler.py]
- 2026-08-16T19:34:20Z `attempt`: Removed the unused Path import; backend Pyright now reports 0 errors and 0 warnings. [backend/handlers/media_upscale_handler.py] (worked)
- 2026-08-16T19:34:25Z `fix`: MediaUpscaleHandler is free of the stale import and backend Pyright is clean. [backend/handlers/media_upscale_handler.py]
