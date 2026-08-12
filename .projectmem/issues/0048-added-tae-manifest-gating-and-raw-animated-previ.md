# #0048 Added TAE manifest gating and raw animated preview-media bridging; focused bridge suite exposed the director manifest expectation that needed updating.

- 2026-08-12T15:23:23Z `issue`: Added TAE manifest gating and raw animated preview-media bridging; focused bridge suite exposed the director manifest expectation that needed updating. [backend/services/wangp_bridge.py]
- 2026-08-12T15:23:23Z `attempt`: Added TAE manifest gating and raw animated preview-media bridging; focused bridge suite exposed the director manifest expectation that needed updating. [backend/services/wangp_bridge.py] (partial)
- 2026-08-12T15:23:36Z `attempt`: Focused bridge tests pass after updating the affected director manifest contract: 38 passed. [backend/services/wangp_bridge.py] (worked)
- 2026-08-12T15:23:39Z `fix`: TAE previews are gated to LTX and MiniMax H3 manifests, and animated preview media now reaches AiVS through the existing cache-busted preview URL. [backend/services/wangp_bridge.py]
