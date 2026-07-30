# #0392 Full backend suite has two pre-existing model-profile tooltip expectation mismatches: Control vs Control Only; Ref/Control vs Reference or Control

- 2026-07-29T15:23:45Z `issue`: Full backend suite has two pre-existing model-profile tooltip expectation mismatches: Control vs Control Only; Ref/Control vs Reference or Control [backend/tests/test_model_profiles.py]
- 2026-07-29T15:24:00Z `attempt`: Confirmed failing assertions target unchanged profile/test files and do not involve crop implementation; full run otherwise reached 294 passed, 1 skipped [backend/tests/test_model_profiles.py] (partial)
- 2026-07-30T12:19:28Z `attempt`: Updated two stale model-profile tooltip expectations to current curated labels Control and Ref/Control; full suite rerun pending [backend/tests/test_model_profiles.py] (partial)
- 2026-07-30T12:19:57Z `attempt`: Full backend suite passes after aligning stale tooltip expectations: 305 passed, 1 skipped [backend/tests/test_model_profiles.py] (worked)
- 2026-07-30T12:20:06Z `fix`: Model-profile tooltip tests now match current Control and Ref/Control labels; full backend suite passes [backend/tests/test_model_profiles.py]
