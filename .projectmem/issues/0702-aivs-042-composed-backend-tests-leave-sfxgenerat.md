# #0702 AIVS-042 composed backend tests leave SfxGenerationHandler wired to the real WanGP bridge instead of the shared fake

- 2026-08-08T16:26:10Z `issue`: AIVS-042 composed backend tests leave SfxGenerationHandler wired to the real WanGP bridge instead of the shared fake [backend/tests/conftest.py]
- 2026-08-08T16:27:04Z `attempt`: Wired SFX handler to FakeWanGPBridge and reset its call log in enable_wangp [backend/tests/conftest.py] (partial)
- 2026-08-08T16:37:39Z `fix`: Focused SFX endpoint tests now run through the composed fake WanGP bridge [backend/tests/conftest.py]
