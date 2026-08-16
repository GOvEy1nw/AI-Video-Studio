# #0077 Style LoRA download call falls through into WanGP full model component download path

- 2026-08-15T18:49:48Z `issue`: Style LoRA download call falls through into WanGP full model component download path [backend/services/wangp_bridge.py]
- 2026-08-15T18:50:29Z `attempt`: Passed file_type=1 so WanGP returns after LoRA processing instead of querying all model files [backend/services/wangp_bridge.py] (worked)
- 2026-08-15T18:51:18Z `fix`: Confirmed style downloads use WanGP file_type=1 LoRA-only path; focused bridge and generation tests pass [backend/services/wangp_bridge.py]
