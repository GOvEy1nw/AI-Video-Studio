# #0365 New curated image profiles are rejected because resolution resolver allowlist omits their profile IDs

- 2026-07-29T10:52:17Z `issue`: New curated image profiles are rejected because resolution resolver allowlist omits their profile IDs [backend/model_profiles/resolution_resolver.py]
- 2026-07-29T10:53:04Z `attempt`: Mapped six new image profile IDs to shared curated image resolution table and added coverage for every exposed tier/aspect combination [backend/model_profiles/resolution_resolver.py; backend/tests/test_model_profiles.py] (partial)
- 2026-07-29T10:53:19Z `attempt`: Focused model-profile and model-pack tests now pass 62/62 with all new tier/aspect combinations routable [backend/model_profiles/resolution_resolver.py; backend/tests/test_model_profiles.py] (worked)
- 2026-07-29T10:53:22Z `fix`: Six new image profile IDs now reuse the validated shared image resolution matrix; focused tests pass [backend/model_profiles/resolution_resolver.py]
