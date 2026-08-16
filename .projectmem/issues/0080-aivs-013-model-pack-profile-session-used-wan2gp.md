# #0080 AIVS-013 model-pack profile session used Wan2GP root config instead of AiVS app-owned config

- 2026-08-16T12:16:06Z `issue`: AIVS-013 model-pack profile session used Wan2GP root config instead of AiVS app-owned config [backend/wangp_model_packs.py]
- 2026-08-16T12:16:18Z `attempt`: Passed the AiVS app-owned wangp_bridge/wgp_config.json path to the model-pack WanGPSession [backend/wangp_model_packs.py] (partial)
- 2026-08-16T12:17:59Z `attempt`: Focused model-pack/profile tests and Pyright passed after app-owned config path change [backend/wangp_model_packs.py] (worked)
- 2026-08-16T12:18:05Z `fix`: Model-pack profile resolution now uses AiVS userData/wangp_bridge/wgp_config.json instead of the Wan2GP checkout config [backend/wangp_model_packs.py]
