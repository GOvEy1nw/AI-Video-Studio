# #0069 LTX Turbo's solver auto-LoRA is fixed at 0.5 and request-specific LoRA paths overwrite profile LoRAs

- 2026-08-14T10:39:34Z `issue`: LTX Turbo's solver auto-LoRA is fixed at 0.5 and request-specific LoRA paths overwrite profile LoRAs [backend/handlers/video_generation_handler.py]
- 2026-08-14T10:41:08Z `attempt`: Explicitly selected LTX distilled LoRA at 0.6 per phase and composed profile LoRAs with multi-shot/video-tool LoRAs [backend/handlers/video_generation_handler.py] (partial)
- 2026-08-14T10:41:48Z `attempt`: Ran focused backend tests; implementation passed but three old assertions still expected Turbo to have no explicit distilled LoRA [backend/tests/test_generation.py] (partial)
- 2026-08-14T10:43:10Z `attempt`: Removed the explicit LTX 0.6 override and additive handler changes after user chose WanGP's native 0.5 behavior; retained only H3 0.75 [backend/model_profiles/profiles.py] (partial)
- 2026-08-14T10:43:36Z `attempt`: Focused profile, generation, and model-pack tests passed with H3 at 0.75 and LTX left on native distilled_8_steps behavior [backend/model_profiles/profiles.py] (worked)
- 2026-08-14T10:43:41Z `fix`: Set H3 Turbo LoRA to 0.75 while retaining WanGP's native LTX distilled_8_steps auto-LoRA strength of 0.5 [backend/model_profiles/profiles.py]
