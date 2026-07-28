# #0174 Camera compiler contract addition broke the exact model-profile response assertion

- 2026-07-26T11:16:32Z `issue`: Camera compiler contract addition broke the exact model-profile response assertion [backend/tests/test_model_profiles.py]
- 2026-07-26T11:16:51Z `attempt`: Updated the exact profile contract assertion with cameraCompiler natural_language [backend/tests/test_model_profiles.py] (worked)
- 2026-07-26T11:17:25Z `fix`: Model profile contract assertion includes the camera compiler and the focused suite passes [backend/tests/test_model_profiles.py]
