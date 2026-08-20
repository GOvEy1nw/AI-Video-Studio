# #0114 Style generation progress returns HTTP 500 because GenerationProgressResponse.phaseIndex receives 'Downloading selected style' instead of an integer

- 2026-08-19T12:00:53Z `issue`: Style generation progress returns HTTP 500 because GenerationProgressResponse.phaseIndex receives 'Downloading selected style' instead of an integer [backend/handlers/generation_handler.py]
- 2026-08-19T12:13:46Z `attempt`: Moved the style download message from phaseIndex to the ninth statusDetail callback slot and added an exact callback tuple assertion. [backend/services/wangp_bridge.py] (partial)
- 2026-08-19T12:15:15Z `attempt`: Focused bridge regression passed and backend Pyright reported 0 errors and 0 warnings after correcting the progress callback slots. [backend/tests/test_wangp_bridge.py] (worked)
- 2026-08-19T12:15:25Z `fix`: Style LoRA download progress now sends its message in statusDetail, preserving a null phaseIndex and preventing progress endpoint validation failures. [backend/services/wangp_bridge.py]
