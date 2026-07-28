# #0164 New model availability test accidentally retained unrelated profile assertions outside its local response/data scope, causing NameError.

- 2026-07-26T10:46:06Z `issue`: New model availability test accidentally retained unrelated profile assertions outside its local response/data scope, causing NameError. [backend/tests/test_model_profiles.py]
- 2026-07-26T10:46:11Z `attempt`: Added Phase 1 policy/availability assertions; the focused suite exposed a misplaced block in the new availability test. [backend/tests/test_model_profiles.py] (partial)
- 2026-07-26T10:47:29Z `attempt`: Repaired the availability test's response scope; the targeted profile endpoint test now passes. [backend/tests/test_model_profiles.py] (worked)
- 2026-07-26T10:47:39Z `fix`: Model profile availability and existing video-profile assertions now share a valid local response payload. [backend/tests/test_model_profiles.py]
