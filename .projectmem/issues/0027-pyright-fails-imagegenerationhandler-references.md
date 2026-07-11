# #0027 Pyright fails: ImageGenerationHandler references Path without import, causing unknown types; VideoGenerationHandler has unused duration helper.

- 2026-07-10T16:14:35Z `issue`: Pyright fails: ImageGenerationHandler references Path without import, causing unknown types; VideoGenerationHandler has unused duration helper. [backend/handlers/image_generation_handler.py]
- 2026-07-10T16:15:19Z `attempt`: Imported pathlib.Path for image input validation and removed orphaned direct-API duration constants/helper; Pyright recheck pending. [backend/handlers/image_generation_handler.py] (partial)
- 2026-07-10T16:15:29Z `fix`: Image input paths are typed via pathlib.Path and unused direct-API duration code removed; pyright reports 0 errors. [backend/handlers/image_generation_handler.py]
