# #0090 AIVS-015 bridge sends spatial_upsampler but WanGPSession expects spatial_upsampling, silently disabling upscale

- 2026-08-16T19:39:47Z `issue`: AIVS-015 bridge sends spatial_upsampler but WanGPSession expects spatial_upsampling, silently disabling upscale [backend/services/wangp_bridge.py]
- 2026-08-16T19:40:25Z `attempt`: Changed only the WanGPSession call keyword and its focused assertion to the public spatial_upsampling contract [backend/services/wangp_bridge.py] (worked)
- 2026-08-16T19:40:47Z `fix`: WanGP bridge now sends spatial_upsampling and the focused public-contract test passes [backend/services/wangp_bridge.py]
