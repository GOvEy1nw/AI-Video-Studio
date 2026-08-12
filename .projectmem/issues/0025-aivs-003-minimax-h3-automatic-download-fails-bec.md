# #0025 AIVS-003 MiniMax H3 automatic download fails because `_download_model_dependencies` passes unsupported `progress_callback` to the current WanGP `download_models()` API.

- 2026-08-11T16:29:49Z `issue`: AIVS-003 MiniMax H3 automatic download fails because `_download_model_dependencies` passes unsupported `progress_callback` to the current WanGP `download_models()` API. [backend/wangp_model_packs.py]
- 2026-08-11T17:05:15Z `attempt`: Removed the unsupported callback keyword from all `wgp.download_models()` calls, aligned the fake with the managed WanGP signature, and retained callbacks only for the supported `process_files_def` path; focused tests and Pyright pass. [backend/wangp_model_packs.py] (worked)
- 2026-08-11T17:05:23Z `fix`: Model-pack downloads now call the current WanGP `download_models()` API without an unsupported callback while supported definition downloads retain structured progress events. [backend/wangp_model_packs.py]
