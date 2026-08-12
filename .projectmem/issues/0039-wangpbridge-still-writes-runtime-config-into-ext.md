# #0039 WanGPBridge still writes runtime config into external WANGP_ROOT/wgp_config.json during normal development.

- 2026-08-12T10:17:31Z `issue`: WanGPBridge still writes runtime config into external WANGP_ROOT/wgp_config.json during normal development. [backend/services/wangp_bridge.py]
- 2026-08-12T10:24:17Z `attempt`: Moved runtime config to app-owned config_dir and seeded it from read-only AiVS wgp_config.json; focused bridge tests pass. [backend/services/wangp_bridge.py] (worked)
- 2026-08-12T10:24:17Z `fix`: WanGP runtime settings no longer modify external or AiVS checkout config files. [backend/services/wangp_bridge.py]
