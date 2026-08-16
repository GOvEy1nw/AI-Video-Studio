# #0082 H3 accelerator IDs use uppercase AIVS prefix, violating WanGP's lowercase explicit profile_id regex and blocking resolve_profiles before lookup.

- 2026-08-16T14:18:18Z `issue`: H3 accelerator IDs use uppercase AIVS prefix, violating WanGP's lowercase explicit profile_id regex and blocking resolve_profiles before lookup. [backend/model_profiles/video_profiles.py]
- 2026-08-16T14:19:46Z `attempt`: Changed both H3 accelerator profile IDs and every AiVS fake/assertion from uppercase AIVS_ to validator-compliant lowercase aivs_. [backend/model_profiles/video_profiles.py] (worked)
- 2026-08-16T14:21:10Z `attempt`: First focused rerun used the wrong pytest class node for the H3 profile test, so collection exited 4 before running tests. [backend/tests/test_model_profiles.py] (failed)
- 2026-08-16T14:21:35Z `attempt`: Corrected focused H3 resolver/profile/pack node IDs; all five tests passed after lowercase accelerator-ID replacement. [backend/tests/test_generation.py] (worked)
- 2026-08-16T14:21:41Z `fix`: H3 accelerator IDs now use lowercase aivs_ in Wan2GP and AiVS; actual WanGPSession resolution succeeded for FL2VA and Ref2VA at six steps, and five focused AiVS tests passed. [backend/model_profiles/video_profiles.py]
