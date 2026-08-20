# #0110 Focused LTX style test expected the old WanGP model type without the current aivs_ prefix for ensure_style_lora

- 2026-08-19T11:25:41Z `issue`: Focused LTX style test expected the old WanGP model type without the current aivs_ prefix for ensure_style_lora [backend/tests/test_generation.py]
- 2026-08-19T11:25:59Z `attempt`: Updated the focused style-download expectation to the current aivs_ltx2_25_22B_distilled profile mapping; rerun pending [backend/tests/test_generation.py] (partial)
- 2026-08-19T11:27:34Z `attempt`: Updated the same stale current-model expectation in the no-style happy-path assertion after the expanded style contract run exposed it; final focused rerun pending [backend/tests/test_generation.py] (partial)
- 2026-08-19T11:31:37Z `fix`: Aligned two focused test expectations with the existing curated aivs_ltx2_25_22B_distilled model mapping; focused style tests pass [backend/tests/test_generation.py]
