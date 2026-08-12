# #0049 TAE preview bridge implementation fails Pyright because MIME and raw byte payloads remain insufficiently narrowed.

- 2026-08-12T15:27:13Z `issue`: TAE preview bridge implementation fails Pyright because MIME and raw byte payloads remain insufficiently narrowed. [backend/services/wangp_bridge.py]
- 2026-08-12T15:27:27Z `attempt`: Narrowed preview MIME to str and WanGP PreviewMedia payload to bytes before suffix lookup and file write. [backend/services/wangp_bridge.py] (worked)
- 2026-08-12T15:27:40Z `fix`: TAE preview bridge now narrows MIME and raw bytes explicitly; Pyright reports zero errors and focused bridge tests pass 38/38. [backend/services/wangp_bridge.py]
