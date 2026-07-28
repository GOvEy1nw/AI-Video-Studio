# #0195 Full backend suite retains a lower-snap expectation of 145 frames after nearest 8n+1 normalization now returns 153

- 2026-07-26T12:56:44Z `issue`: Full backend suite retains a lower-snap expectation of 145 frames after nearest 8n+1 normalization now returns 153 [backend/tests/test_wangp_bridge.py]
- 2026-07-26T12:56:59Z `attempt`: Updated bridge source-frame regression to nearest 8n+1 result 153; full backend rerun pending [backend/tests/test_wangp_bridge.py] (partial)
- 2026-07-26T12:57:54Z `attempt`: First assertion edit changed the unrelated exact 6s timing case to 153 while leaving the source-frame case at 145; apply contextual correction [backend/tests/test_wangp_bridge.py] (failed)
- 2026-07-26T12:58:18Z `attempt`: Both exact-duration and source-frame nearest-snap bridge regressions pass with contextual expectations [backend/tests/test_wangp_bridge.py] (worked)
- 2026-07-26T12:58:21Z `fix`: WanGP bridge timing tests now distinguish exact 145-frame duration from nearest-snapped 153-frame source input [backend/tests/test_wangp_bridge.py]
