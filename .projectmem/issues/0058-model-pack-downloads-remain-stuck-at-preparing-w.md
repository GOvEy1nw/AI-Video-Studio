# #0058 Model-pack downloads remain stuck at Preparing while WanGP downloads continue without progress events

- 2026-08-13T08:48:51Z `issue`: Model-pack downloads remain stuck at Preparing while WanGP downloads continue without progress events [backend/wangp_model_packs.py]
- 2026-08-13T08:51:19Z `attempt`: Ran Wan2GP callback unittest from AiVS root; test discovery failed because the command was executed in the wrong repository [..\Wan2GP\tests\test_model_download_progress.py] (failed)
- 2026-08-13T08:52:07Z `attempt`: Validation batch again used the AiVS root for both cross-repo commands; Wan unittest and backend pytest failed test discovery without exercising code [investigation/tooling] (failed)
- 2026-08-13T08:52:29Z `attempt`: Confirmed Wan2GP callback implementation is healthy (17 tests pass); AiVS model-pack suite passes despite missing model dependency callback assertion, isolating regression to AiVS commit da028f3 [backend/wangp_model_packs.py] (worked)
- 2026-08-13T09:33:58Z `attempt`: Restored the optional progress callback through every AiVS model dependency download and reinstated the focused all-calls forwarding assertion [backend/wangp_model_packs.py] (partial)
- 2026-08-13T09:34:45Z `attempt`: Focused AiVS pack tests pass 13/13, Wan2GP callback tests pass 17/17, Pyright reports zero errors, and git diff check is clean [backend/wangp_model_packs.py] (worked)
- 2026-08-13T09:34:49Z `fix`: Restored AiVS model-pack progress by forwarding the existing callback through all WanGP dependency downloads and protecting the contract with a focused assertion [backend/wangp_model_packs.py]
