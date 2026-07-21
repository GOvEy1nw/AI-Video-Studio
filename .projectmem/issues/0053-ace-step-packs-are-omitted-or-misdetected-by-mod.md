# #0053 ACE-Step packs are omitted or misdetected by model-pack download/readiness flow despite generation-time auto-download.

- 2026-07-21T13:18:20Z `issue`: ACE-Step packs are omitted or misdetected by model-pack download/readiness flow despite generation-time auto-download. [backend/wangp_model_packs.py; electron/python-setup.ts]
- 2026-07-21T13:25:12Z `attempt`: Stopped model packs from requiring the separate Utility/MatAnyone file set during download validation and readiness scans. [backend/wangp_model_packs.py] (partial)
- 2026-07-21T13:29:07Z `attempt`: Focused tests passed (32); real pinned WanGP scan of C:\WanGP_Models recognized both downloaded ACE-Step packs as installed. [backend/wangp_model_packs.py] (worked)
- 2026-07-21T13:29:11Z `fix`: Model-pack validation now checks only each pack's own WanGP dependencies; existing ACE-Step Fast and XL files are detected as ready. [backend/wangp_model_packs.py]
