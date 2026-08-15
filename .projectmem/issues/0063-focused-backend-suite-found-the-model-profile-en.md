# #0063 Focused backend suite found the model-profile endpoint test still expected only the two pre-variant video IDs

- 2026-08-13T13:26:53Z `issue`: Focused backend suite found the model-profile endpoint test still expected only the two pre-variant video IDs [backend/tests/test_model_profiles.py]
- 2026-08-13T13:27:09Z `attempt`: Updated the endpoint contract assertion to the four visible Base/Turbo profile IDs [backend/tests/test_model_profiles.py] (partial)
- 2026-08-13T13:27:26Z `attempt`: Focused profile, generation, and model-pack suites pass 131 tests after updating the endpoint variant expectation [backend/tests/test_model_profiles.py] (worked)
- 2026-08-13T13:27:31Z `fix`: Model-profile endpoint now exposes and verifies all four LTX/H3 Base/Turbo profile IDs [backend/tests/test_model_profiles.py]
