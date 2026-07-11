# #0022 Hidden IC-LoRA route still instantiated direct LTX pipelines, keeping legacy runtime graph reachable.

- 2026-07-10T15:31:07Z `issue`: Hidden IC-LoRA route still instantiated direct LTX pipelines, keeping legacy runtime graph reachable. [backend/_routes/ic_lora.py]
- 2026-07-10T15:34:16Z `attempt`: Removed hidden IC-LoRA route and direct pipeline composition; health now reports and warms WanGP only. [backend/app_handler.py] (worked)
- 2026-07-10T15:34:16Z `fix`: Hidden IC-LoRA direct route and pipeline composition removed; no reachable direct pipeline is instantiated. [backend/app_handler.py]
