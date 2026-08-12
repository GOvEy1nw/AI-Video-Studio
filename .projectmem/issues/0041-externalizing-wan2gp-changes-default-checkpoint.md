# #0041 Externalizing Wan2GP changes default checkpoint and LoRA directories without migrating existing installed model data.

- 2026-08-12T10:18:11Z `issue`: Externalizing Wan2GP changes default checkpoint and LoRA directories without migrating existing installed model data. [electron/python-setup.ts]
- 2026-08-12T10:24:18Z `attempt`: Added idempotent collision-preserving migration from legacy packaged ckpts/loras to app-owned model directories; Electron tests pass. [electron/python-setup.ts] (worked)
- 2026-08-12T10:24:18Z `fix`: Existing packaged checkpoint and LoRA data is preserved and discoverable after externalizing Wan2GP. [electron/python-setup.ts]
