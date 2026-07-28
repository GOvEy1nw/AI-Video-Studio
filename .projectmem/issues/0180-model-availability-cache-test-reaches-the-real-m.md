# #0180 Model availability cache test reaches the real missing WanGP root before its injected session

- 2026-07-26T11:33:49Z `issue`: Model availability cache test reaches the real missing WanGP root before its injected session [backend/tests/test_wangp_bridge.py]
- 2026-07-26T11:34:39Z `attempt`: Injected the availability session through the bridge session accessor so the cache test stays independent of a real WanGP root [backend/tests/test_wangp_bridge.py] (worked)
- 2026-07-26T11:35:17Z `fix`: Availability cache regression is independent of the local WanGP installation and passes [backend/tests/test_wangp_bridge.py]
