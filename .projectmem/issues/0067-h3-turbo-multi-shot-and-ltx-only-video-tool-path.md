# #0067 H3 Turbo multi-shot and LTX-only video-tool paths would overwrite its required Turbo LoRA with incompatible LTX LoRAs

- 2026-08-13T13:35:47Z `issue`: H3 Turbo multi-shot and LTX-only video-tool paths would overwrite its required Turbo LoRA with incompatible LTX LoRAs [backend/handlers/video_generation_handler.py]
- 2026-08-13T13:35:52Z `attempt`: Rejected H3 multi-shot and LTX-only LoRA tools before request compilation, preserving the H3 Turbo LoRA contract [backend/handlers/video_generation_handler.py] (partial)
- 2026-08-13T13:36:11Z `attempt`: Focused backend suites pass 133 tests, including H3 Turbo activated-LoRA and multi-shot rejection coverage [backend/handlers/video_generation_handler.py] (worked)
- 2026-08-13T13:36:19Z `fix`: H3 Turbo now retains its required LoRA by rejecting incompatible LTX multi-shot/tool LoRA overrides [backend/handlers/video_generation_handler.py]
- 2026-08-13T13:38:51Z `attempt`: Moved H3 multi-shot/tool validation before job creation and covered extend plus a successful recovery request; focused suites pass 133 tests [backend/handlers/video_generation_handler.py] (worked)
