# #0054 Director bridge contract test still expects the old mode-only preview payload after adding persisted preview options

- 2026-08-12T17:00:32Z `issue`: Director bridge contract test still expects the old mode-only preview payload after adding persisted preview options [backend/tests/test_wangp_bridge.py]
- 2026-08-12T17:00:46Z `attempt`: Updated the Director manifest contract to assert the full default preview options now sent to WanGP [backend/tests/test_wangp_bridge.py] (worked)
- 2026-08-12T17:01:23Z `fix`: Director manifest expectation now covers the full default preview payload; bridge suite passes 40 tests [backend/tests/test_wangp_bridge.py]
