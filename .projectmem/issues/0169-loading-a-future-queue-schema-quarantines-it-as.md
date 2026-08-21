# #0169 Loading a future queue schema quarantines it as corrupt, violating downgrade safety and allowing later overwrite.

- 2026-08-20T22:39:09Z `issue`: Loading a future queue schema quarantines it as corrupt, violating downgrade safety and allowing later overwrite. [backend/services/generation_queue_store.py]
- 2026-08-20T22:40:11Z `attempt`: Store detects future schema before parsing, leaves the file untouched, and refuses subsequent saves; focused downgrade test passes. [backend/services/generation_queue_store.py] (worked)
- 2026-08-20T22:40:16Z `fix`: Future generation-queue schemas are preserved byte-for-byte and cannot be overwritten by this version; backend queue suite passes. [backend/services/generation_queue_store.py]
