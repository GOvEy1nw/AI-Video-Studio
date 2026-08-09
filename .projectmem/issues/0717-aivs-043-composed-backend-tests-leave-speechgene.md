# #0717 AIVS-043 composed backend tests leave SpeechGenerationHandler wired to the real bridge, so enabled fake-WanGP requests return 503.

- 2026-08-09T11:15:00Z `issue`: AIVS-043 composed backend tests leave SpeechGenerationHandler wired to the real bridge, so enabled fake-WanGP requests return 503. [backend/tests/conftest.py]
- 2026-08-09T11:15:36Z `attempt`: Wired the composed SpeechGenerationHandler to FakeWanGPBridge and reset speech call state in enable_wangp; rerunning focused endpoint tests. [backend/tests/conftest.py] (partial)
- 2026-08-09T11:19:12Z `attempt`: Composed fake-WanGP Speech endpoint tests now run through the shared fake and pass. [backend/tests/conftest.py] (worked)
- 2026-08-09T11:19:19Z `fix`: Wired SpeechGenerationHandler to FakeWanGPBridge in composed tests and reset speech calls; focused endpoint tests pass. [backend/tests/conftest.py]
