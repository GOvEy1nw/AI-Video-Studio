# #0471 IC-LoRA Video Tools use guidance_phases=1 and loras_multipliers='1', differing from proven WanGP settings

- 2026-08-02T11:23:29Z `issue`: IC-LoRA Video Tools use guidance_phases=1 and loras_multipliers='1', differing from proven WanGP settings [backend/handlers/video_generation_handler.py]
- 2026-08-02T11:27:36Z `attempt`: Changed IC-LoRA defaults to guidance_phases=2 and empty loras_multipliers; added shared LTX video PrunaAI VAE enforcement and Video Tools prompt-enhancement reset, pending validation. [backend/handlers/video_generation_handler.py] (partial)
- 2026-08-02T11:28:27Z `attempt`: Focused IC-LoRA, Quick Gen bridge, and Director bridge tests pass with guidance_phases=2, empty loras_multipliers, and PrunaAI VAE; TypeScript also passes. [backend/handlers/video_generation_handler.py] (worked)
- 2026-08-02T11:35:25Z `fix`: Confirmed IC-LoRA Tools now submit guidance_phases=2 and empty loras_multipliers; exact handler/bridge tests, 90 affected tests, full 314-test backend suite, and Pyright pass. [backend/handlers/video_generation_handler.py]
