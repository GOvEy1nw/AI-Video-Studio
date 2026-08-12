# #0055 Advanced Settings reports save/reload failure when model-pack refresh crashes on WanGP-unknown curated model ideogram4_int8

- 2026-08-12T18:12:11Z `issue`: Advanced Settings reports save/reload failure when model-pack refresh crashes on WanGP-unknown curated model ideogram4_int8 [backend/wangp_model_packs.py]
- 2026-08-12T18:16:42Z `attempt`: Aligned stable AiVS Ideogram profile and pack IDs to current WanGP runtime model types ideogram4 and ideogram4_turbotime [backend/wangp_model_packs.py] (partial)
- 2026-08-12T18:17:23Z `attempt`: Corrected Ideogram runtime IDs; the exact external WanGP --list inventory command now exits successfully and emits the full pack event [backend/wangp_model_packs.py] (worked)
- 2026-08-12T18:17:52Z `fix`: Model-pack refresh now succeeds against the configured external WanGP after aligning Ideogram pack mappings to registered model IDs [backend/wangp_model_packs.py]
