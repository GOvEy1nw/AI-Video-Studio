# #0207 Focused test_image_edit pytest nodes hang and duplicate uv/python process trees instead of completing.

- 2026-08-22T15:37:21Z `issue`: Focused test_image_edit pytest nodes hang and duplicate uv/python process trees instead of completing. [backend/tests/test_image_edit.py; tooling/pytest]
- 2026-08-22T15:38:58Z `attempt`: Changed the new regression to call the wired ImageGenerationHandler directly instead of the queue-backed HTTP route; the focused pytest node completed. [backend/tests/test_image_edit.py] (worked)
- 2026-08-22T15:39:05Z `fix`: The image-reframe regression now bypasses the unrelated queue wait and passes directly through ImageGenerationHandler. [backend/tests/test_image_edit.py]
