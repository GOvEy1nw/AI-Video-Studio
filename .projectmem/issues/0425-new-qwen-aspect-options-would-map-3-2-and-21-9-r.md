# #0425 New Qwen aspect options would map 3:2 and 21:9 requests to older nearest presets

- 2026-07-31T10:15:46Z `issue`: New Qwen aspect options would map 3:2 and 21:9 requests to older nearest presets [backend/services/wangp_bridge.py]
- 2026-07-31T10:16:20Z `attempt`: Added Qwen 3:2, 2:3, 21:9, and 9:21 resolution buckets with bridge coverage [backend/services/wangp_bridge.py; backend/tests/test_wangp_bridge.py] (partial)
- 2026-07-31T10:16:36Z `attempt`: Focused model-profile and WanGP bridge aspect tests passed (83 tests) [backend model profile and bridge tests] (worked)
- 2026-07-31T10:16:41Z `fix`: Qwen mapping preserves new 3:2 and ultrawide curated aspect choices; focused backend tests pass [backend/services/wangp_bridge.py; backend/tests/test_wangp_bridge.py]
