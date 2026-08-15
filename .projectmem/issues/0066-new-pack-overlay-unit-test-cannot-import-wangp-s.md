# #0066 New pack-overlay unit test cannot import WanGP shared.config_groups when run from the standalone AiVS backend test environment

- 2026-08-13T13:32:47Z `issue`: New pack-overlay unit test cannot import WanGP shared.config_groups when run from the standalone AiVS backend test environment [backend/tests/test_wangp_model_packs.py]
- 2026-08-13T13:33:04Z `attempt`: Stubbed only WanGP shared.config_groups in the focused unit test so the overlay logic can run without importing the external checkout [backend/tests/test_wangp_model_packs.py] (partial)
- 2026-08-13T13:33:31Z `attempt`: Focused backend suites pass 132 tests with isolated config-overlay and LoRA-merging coverage [backend/tests/test_wangp_model_packs.py] (worked)
- 2026-08-13T13:33:39Z `fix`: Pack-overlay test now isolates the WanGP config selector and verifies effective config plus LoRA merging; focused suites pass [backend/tests/test_wangp_model_packs.py]
