# #0209 AIVS-021 fix removed image Reframe guide/mask generation, but required contract is guide/mask plus numeric directional outpainting.

- 2026-08-22T16:02:21Z `issue`: AIVS-021 fix removed image Reframe guide/mask generation, but required contract is guide/mask plus numeric directional outpainting. [backend/handlers/image_generation_handler.py; backend/tests/test_image_edit.py]
- 2026-08-22T16:05:38Z `attempt`: Restored image Reframe guide/mask path and added shared numeric outpainting mapping; scoped diff check passed but pytest was sandbox-blocked by uv cache access. [backend/handlers/image_generation_handler.py; backend/tests/test_image_edit.py] (partial)
- 2026-08-22T16:06:03Z `attempt`: Focused image Reframe and shared mapping regressions pass with guide/mask plus numeric outpainting fields. [backend/handlers/image_generation_handler.py; backend/tests/test_image_edit.py] (worked)
- 2026-08-22T16:23:50Z `fix`: Image Reframe now preserves generated guide/mask mode while overriding '#' with shared numeric directional outpainting; focused tests and review pass. [backend/handlers/image_generation_handler.py; backend/tests/test_image_edit.py]
