# #0390 Strict Pyright cannot infer type of image crop input_media accumulator

- 2026-07-29T15:13:47Z `issue`: Strict Pyright cannot infer type of image crop input_media accumulator [backend/handlers/image_generation_handler.py]
- 2026-07-29T15:14:03Z `attempt`: Annotated cropped image input accumulator as list[GenerateImageInputMedia] and imported concrete API type [backend/handlers/image_generation_handler.py] (worked)
- 2026-07-29T15:14:27Z `fix`: Strict Pyright passes after typing cropped image input accumulator [backend/handlers/image_generation_handler.py]
