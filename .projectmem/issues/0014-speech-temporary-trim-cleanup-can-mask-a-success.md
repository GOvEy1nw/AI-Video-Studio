# #0014 Speech temporary trim cleanup can mask a successful generation if unlink fails, and the ffmpeg trim handoff lacks focused regression coverage.

- 2026-08-11T13:47:36Z `issue`: Speech temporary trim cleanup can mask a successful generation if unlink fails, and the ffmpeg trim handoff lacks focused regression coverage. [backend/handlers/speech_generation_handler.py]
- 2026-08-11T13:59:15Z `attempt`: Added ffmpeg trim handoff/cleanup regression coverage and made temporary unlink failures non-fatal; 35 focused backend tests pass. [backend/handlers/speech_generation_handler.py] (worked)
- 2026-08-11T13:59:25Z `fix`: Trimmed Speech references are materialized for WanGP, cleaned afterward, and cleanup failures cannot mask completed generation. [backend/handlers/speech_generation_handler.py]
